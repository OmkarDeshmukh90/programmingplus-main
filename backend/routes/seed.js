const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const router = express.Router();

const slugify = (text) => {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
};

const problemList = [
    // 1. Arrays & Hashing
    "Two Sum", "Contains Duplicate", "Valid Anagram", "Group Anagrams", "Top K Frequent Elements",
    "Product of Array Except Self", "Maximum Subarray", "Maximum Product Subarray",
    "Find Minimum in Rotated Sorted Array", "Search in Rotated Sorted Array", "3Sum",
    "Container With Most Water", "Longest Consecutive Sequence", "Subarray Sum Equals K",
    "Majority Element", "Missing Number", "Find All Numbers Disappeared in Array",
    "Set Matrix Zeroes", "Spiral Matrix", "Rotate Image",

    // 2. Two Pointers & Sliding Window
    "Valid Palindrome", "Two Sum II - Input Array Is Sorted", "3Sum Closest",
    "Longest Substring Without Repeating Characters", "Minimum Window Substring",
    "Sliding Window Maximum", "Permutation in String", "Find All Anagrams in a String",
    "Longest Repeating Character Replacement",

    // 3. Strings
    "Longest Palindromic Substring", "Palindromic Substrings", "Valid Parentheses", "Decode String",
    "String to Integer (atoi)", "Multiply Strings", "Longest Common Prefix", "Find the Index of the First Occurrence in a String",
    "Count and Say", "Group Shifted Strings",

    // 4. Linked List
    "Reverse Linked List", "Linked List Cycle", "Merge Two Sorted Lists", "Remove Nth Node From End of List",
    "Reorder List", "Copy List with Random Pointer", "Add Two Numbers", "Intersection of Two Linked Lists",
    "Palindrome Linked List", "Flatten a Multilevel Doubly Linked List",

    // 5. Trees & BST
    "Maximum Depth of Binary Tree", "Same Tree", "Invert Binary Tree", "Binary Tree Level Order Traversal",
    "Validate Binary Search Tree", "Kth Smallest Element in a BST", "Lowest Common Ancestor of a Binary Search Tree",
    "Lowest Common Ancestor of a Binary Tree", "Diameter of Binary Tree", "Balanced Binary Tree",
    "Path Sum", "Construct Binary Tree from Preorder and Inorder Traversal", "Serialize and Deserialize Binary Tree",
    "Subtree of Another Tree", "Binary Tree Right Side View",

    // 6. Graphs
    "Number of Islands", "Clone Graph", "Course Schedule", "Course Schedule II", "Pacific Atlantic Water Flow",
    "Surrounded Regions", "Rotting Oranges", "Word Ladder", "Graph Valid Tree", "Network Delay Time",

    // 7. Dynamic Programming
    "Climbing Stairs", "House Robber", "House Robber II", "Longest Increasing Subsequence", "Longest Common Subsequence",
    "Coin Change", "Combination Sum IV", "Word Break", "Partition Equal Subset Sum", "Decode Ways",
    "Unique Paths", "Minimum Path Sum", "Edit Distance", "Burst Balloons", "Best Time to Buy and Sell Stock with Cooldown",

    // 8. Stack / Queue / Heap
    "Min Stack", "Daily Temperatures", "Evaluate Reverse Polish Notation", "Largest Rectangle in Histogram", "Find Median from Data Stream",

    // 9. Backtracking
    "Subsets", "Permutations", "Combination Sum", "N-Queens", "Word Search"
];

const LEETCODE_API = 'https://leetcode.com/graphql';

const GET_QUESTION_QUERY = `
query questionData($titleSlug: String!) {
  question(titleSlug: $titleSlug) {
    questionId
    title
    titleSlug
    content
    difficulty
    topicTags { name }
    exampleTestcaseList
    metaData
    codeSnippets { lang langSlug code }
  }
}
`;

// Helper to parse basic inputs from exampleTestcaseList
const parseTestCases = (tcList, metaDataStr) => {
    try {
        const meta = JSON.parse(metaDataStr);
        const params = meta.params;
        const cases = [];

        tcList.forEach(tcStr => {
            // LeetCode API sometimes returns literal '\\n' instead of actual newlines.
            const lines = tcStr.split(/\\n|\n/);
            const inputObj = {};

            // This is a naive parsing. LeetCode sends test case arguments sequentially separated by newlines.
            lines.forEach((line, i) => {
                if (params[i]) {
                    try {
                        inputObj[params[i].name] = JSON.parse(line);
                    } catch (e) {
                        // Fallback for strings that aren't quoted properly
                        if (line === 'true') inputObj[params[i].name] = true;
                        else if (line === 'false') inputObj[params[i].name] = false;
                        else inputObj[params[i].name] = line;
                    }
                }
            });
            cases.push({ input: inputObj, expectedOutput: "null (Auto-generated, run to evaluate)" });
        });
        return cases;
    } catch (e) {
        return [{ input: {}, expectedOutput: null }];
    }
};

router.get("/run", async (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.write('<h2>Starting LeetCode Seeding Process...</h2>');
    res.write('<p>Fetching 100 questions. This may take 1-2 minutes...</p>');

    let db = [];
    let idCounter = 1;

    for (let title of problemList) {
        let slug = slugify(title);
        // Special manual overrides for tricky LeetCode slugs
        if (title === "Find the Index of the First Occurrence in a String") slug = "find-the-index-of-the-first-occurrence-in-a-string";
        if (title === "Two Sum II - Input Array Is Sorted") slug = "two-sum-ii-input-array-is-sorted";

        try {
            const response = await axios.post(LEETCODE_API, {
                query: GET_QUESTION_QUERY,
                variables: { titleSlug: slug }
            });

            const q = response.data.data.question;
            if (!q) {
                res.write(`<p style="color:red">Failed to find: ${title} (${slug})</p>`);
                continue;
            }

            const tags = q.topicTags.map(t => t.name.toLowerCase().replace(/\s+/g, '-'));

            // Extract expected outputs from description
            const outputs = [];
            const regex = /Output:\s*([^\n<]+)/gi;
            let match;
            while ((match = regex.exec(q.content)) !== null) {
                let outStr = match[1].trim();
                outStr = outStr.split('Explanation:')[0].trim();
                outStr = outStr.split('Example')[0].trim();
                outStr = outStr.replace(/&quot;/g, '"');
                try {
                    outputs.push(JSON.parse(outStr));
                } catch (e) {
                    outputs.push(outStr);
                }
            }

            // Extract code snippets
            const snippets = {};
            q.codeSnippets.forEach(s => {
                if (s.langSlug === 'cpp') snippets.cpp = s.code;
                if (s.langSlug === 'java') snippets.java = s.code;
                if (s.langSlug === 'python3') snippets.python = s.code;
            });

            const sampleCases = parseTestCases(q.exampleTestcaseList, q.metaData);

            // Inject expected outputs into test cases
            sampleCases.forEach((tc, idx) => {
                if (outputs[idx] !== undefined) tc.expectedOutput = outputs[idx];
            });

            db.push({
                id: String(idCounter++),
                title: q.title,
                difficulty: q.difficulty,
                tags: tags,
                description: q.content.replace(/<[^>]+>/g, ''), // Strip HTML for now
                constraints: "Refer to description.",
                sampleCases: sampleCases,
                hiddenCases: JSON.parse(JSON.stringify(sampleCases)), // Deep copy
                codeSnippets: snippets,
                metaData: q.metaData
            });

            res.write(`<p>✅ Synced: ${q.title}</p>`);

        } catch (e) {
            res.write(`<p style="color:red">Error fetching ${title}: ${e.message}</p>`);
        }

        // Rate limit protection
        await new Promise(r => setTimeout(r, 300));
    }

    const dbPath = path.join(__dirname, '../data/questions.json');
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

    res.write('<h3>🎉 Seeding Complete! Overwrote questions.json with ' + db.length + ' problems.</h3>');
    res.write('<p><strong>IMPORTANT:</strong> You must restart your backend server (npm start) for the new database to load into memory.</p>');
    res.end();
});

module.exports = router;
