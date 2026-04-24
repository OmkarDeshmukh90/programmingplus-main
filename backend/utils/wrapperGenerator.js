const toCppLiteral = (val) => {
    if (val === null) return "nullptr";
    if (typeof val === 'boolean') return val ? "true" : "false";
    if (typeof val === 'number') return String(val);
    if (typeof val === 'string') return `"${val}"`;
    if (Array.isArray(val)) {
        if (val.length === 0) return "{}";
        if (typeof val[0] === 'string') {
            return `vector<string>{${val.map(v => `"${v}"`).join(", ")}}`;
        }
        if (Array.isArray(val[0])) {
            return `vector<vector<int>>{${val.map(toCppLiteral).join(", ")}}`;
        }
        return `vector<int>{${val.join(", ")}}`;
    }
    return String(val);
};

const toJavaLiteral = (val) => {
    if (val === null) return "null";
    if (typeof val === 'boolean') return val ? "true" : "false";
    if (typeof val === 'number') return String(val);
    if (typeof val === 'string') return `"${val}"`;
    if (Array.isArray(val)) {
        if (val.length === 0) return "new int[]{}";
        if (typeof val[0] === 'string') {
            return `new String[]{${val.map(v => `"${v}"`).join(", ")}}`;
        }
        if (Array.isArray(val[0])) {
            return `new int[][]{${val.map(toJavaLiteral).join(", ")}}`;
        }
        return `new int[]{${val.join(", ")}}`;
    }
    return String(val);
};

const getFunctionName = (code, language) => {
    if (language === 'python') {
        const match = code.match(/def\s+([a-zA-Z0-9_]+)\s*\(/);
        return match ? match[1] : null;
    } else if (language === 'cpp') {
        const regex = /(?:virtual\s+)?(?:static\s+)?(?:inline\s+)?(?:constexpr\s+)?[\w<>\*\[\]:]+\s+([a-zA-Z0-9_]+)\s*\(/g;
        let m;
        while ((m = regex.exec(code)) !== null) {
            const name = m[1];
            if (name !== 'Solution' && name !== 'main' && !['if','while','for','switch','catch','return'].includes(name)) {
                return name;
            }
        }
    } else if (language === 'java') {
        const regex = /(?:public|private|protected)?\s*(?:static)?\s*(?:final)?\s*[\w<>\*\[\]]+\s+([a-zA-Z0-9_]+)\s*\(/g;
        let m;
        while ((m = regex.exec(code)) !== null) {
            const name = m[1];
            if (name !== 'Solution' && name !== 'main' && name !== 'class' && !['if','while','for','switch','catch','return'].includes(name)) {
                return name;
            }
        }
    }
    return null;
};

const getCppParamTypes = (code, fnName) => {
    const regex = new RegExp(`[\\w<>\\*\\[\\]:]+\\s+${fnName}\\s*\\(([^)]*)\\)`);
    const m = code.match(regex);
    if (!m) return [];
    if (!m[1].trim()) return [];
    return m[1].split(',').map(p => {
        // Remove variable name and references
        let t = p.trim().replace(/\s+[a-zA-Z0-9_]+$/, '').trim();
        return t.replace(/&/g, '').trim(); 
    });
};

const generateWrapper = (language, code, testCases, problem) => {
    const fnName = getFunctionName(code, language) || 'solve';
    const isList = problem && problem.tags && problem.tags.includes('linked-list');
    const isTree = problem && problem.tags && problem.tags.includes('tree');

    if (language === 'python') {
        let pythonWrapper = `\n\n# --- HIDDEN WRAPPER ---\n`;
        pythonWrapper += `import json\n`;
        pythonWrapper += `if __name__ == '__main__':\n`;
        pythonWrapper += `    sol = Solution()\n`;
        pythonWrapper += `    test_cases = ${JSON.stringify(testCases.map(tc => tc.input))}\n`;
        pythonWrapper += `    for tc in test_cases:\n`;
        pythonWrapper += `        res = getattr(sol, "${fnName}")(**tc)\n`;
        pythonWrapper += `        print(json.dumps(res).replace(" ", ""))\n`;
        pythonWrapper += `        print("---END_TC---")\n`;
        return code + pythonWrapper;
    } 
    
    if (language === 'cpp') {
        const paramTypes = getCppParamTypes(code, fnName);
        let cppHeaders = `
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <map>
#include <unordered_map>
#include <set>
#include <unordered_set>
#include <queue>
#include <stack>
using namespace std;

#ifndef LISTNODE_H
#define LISTNODE_H
struct ListNode {
    int val;
    ListNode *next;
    ListNode() : val(0), next(nullptr) {}
    ListNode(int x) : val(x), next(nullptr) {}
    ListNode(int x, ListNode *next) : val(x), next(next) {}
};
#endif

#ifndef TREENODE_H
#define TREENODE_H
struct TreeNode {
    int val;
    TreeNode *left;
    TreeNode *right;
    TreeNode() : val(0), left(nullptr), right(nullptr) {}
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
    TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
};
#endif
`;

        let cppWrapper = `\n\n// --- HIDDEN WRAPPER ---\n`;
        cppWrapper += `
ListNode* buildList(const vector<int>& vec) {
    ListNode dummy;
    ListNode* curr = &dummy;
    for(int x : vec) {
        curr->next = new ListNode(x);
        curr = curr->next;
    }
    return dummy.next;
}

TreeNode* buildTree(const vector<int>& vec) {
    if(vec.empty()) return nullptr;
    TreeNode* root = new TreeNode(vec[0]);
    return root;
}

template<typename T> void printJson(T val) { cout << val; }
void printJson(bool val) { cout << (val ? "true" : "false"); }
void printJson(const string& val) { cout << "\\"" << val << "\\""; }
template<typename T> void printJson(const vector<T>& vec) {
    cout << "[";
    for(size_t i=0; i<vec.size(); ++i) {
        if(i>0) cout << ",";
        printJson(vec[i]);
    }
    cout << "]";
}
void printJson(ListNode* head) {
    cout << "[";
    while(head) {
        cout << head->val;
        if(head->next) cout << ",";
        head = head->next;
    }
    cout << "]";
}
`;
        cppWrapper += `int main() {\n`;
        cppWrapper += `    Solution sol;\n`;
        
        testCases.forEach((tc, idx) => {
            cppWrapper += `    {\n`;
            const args = Object.keys(tc.input);
            const argVars = [];
            args.forEach((argName, i) => {
                const val = tc.input[argName];
                let typeStr = paramTypes[i] || "auto";
                let valStr = toCppLiteral(val);
                
                if (isList && Array.isArray(val) && typeStr.includes("ListNode")) {
                    valStr = `buildList(${valStr})`;
                    typeStr = "ListNode*";
                } else if (isTree && Array.isArray(val) && typeStr.includes("TreeNode")) {
                    valStr = `buildTree(${valStr})`;
                    typeStr = "TreeNode*";
                }
                
                cppWrapper += `        ${typeStr} arg${i} = ${valStr};\n`;
                argVars.push(`arg${i}`);
            });
            cppWrapper += `        auto res = sol.${fnName}(${argVars.join(", ")});\n`;
            cppWrapper += `        printJson(res);\n`;
            cppWrapper += `        cout << "\\n---END_TC---\\n";\n`;
            cppWrapper += `    }\n`;
        });
        
        cppWrapper += `    return 0;\n}\n`;
        return cppHeaders + code + cppWrapper;
    }

    if (language === 'java') {
        // ... (Keep existing java wrapper implementation but add buildList support)
        let javaHeaders = `
import java.util.*;
import java.io.*;

class ListNode {
    int val;
    ListNode next;
    ListNode() {}
    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}
class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;
    TreeNode() {}
    TreeNode(int val) { this.val = val; }
    TreeNode(int val, TreeNode left, TreeNode right) {
        this.val = val;
        this.left = left;
        this.right = right;
    }
}
`;
        let javaWrapper = `\n\n// --- HIDDEN WRAPPER ---\n`;
        javaWrapper += `public class Main {\n`;
        
        javaWrapper += `
    static ListNode buildList(int[] arr) {
        ListNode dummy = new ListNode(0);
        ListNode curr = dummy;
        for(int x : arr) {
            curr.next = new ListNode(x);
            curr = curr.next;
        }
        return dummy.next;
    }
`;

        javaWrapper += `    public static void main(String[] args) {\n`;
        javaWrapper += `        Solution sol = new Solution();\n`;
        
        testCases.forEach((tc, idx) => {
            javaWrapper += `        {\n`;
            const args = Object.keys(tc.input);
            const argVars = [];
            args.forEach((argName, i) => {
                const val = tc.input[argName];
                let typeStr = "Object";
                let valStr = toJavaLiteral(val);
                
                if (typeof val === 'number') typeStr = "int";
                else if (typeof val === 'string') typeStr = "String";
                else if (typeof val === 'boolean') typeStr = "boolean";
                else if (Array.isArray(val)) {
                    if (val.length === 0 || typeof val[0] === 'number') {
                        if (isList) { typeStr = "ListNode"; valStr = `buildList(${valStr})`; }
                        else { typeStr = "int[]"; }
                    }
                    else if (typeof val[0] === 'string') typeStr = "String[]";
                    else if (Array.isArray(val[0])) typeStr = "int[][]";
                }
                
                javaWrapper += `            ${typeStr} arg${i} = ${valStr};\n`;
                argVars.push(`arg${i}`);
            });
            javaWrapper += `            Object res = sol.${fnName}(${argVars.join(", ")});\n`;
            javaWrapper += `            printJson(res);\n`;
            javaWrapper += `            System.out.println("\\n---END_TC---");\n`;
            javaWrapper += `        }\n`;
        });
        
        javaWrapper += `    }\n`;
        
        javaWrapper += `
    static void printJson(Object obj) {
        if (obj == null) { System.out.print("null"); return; }
        if (obj instanceof int[]) {
            int[] arr = (int[]) obj;
            System.out.print("[");
            for (int i=0; i<arr.length; i++) {
                if (i>0) System.out.print(",");
                System.out.print(arr[i]);
            }
            System.out.print("]");
        } else if (obj instanceof Object[]) {
            Object[] arr = (Object[]) obj;
            System.out.print("[");
            for (int i=0; i<arr.length; i++) {
                if (i>0) System.out.print(",");
                printJson(arr[i]);
            }
            System.out.print("]");
        } else if (obj instanceof ListNode) {
            ListNode curr = (ListNode) obj;
            System.out.print("[");
            while (curr != null) {
                System.out.print(curr.val);
                if (curr.next != null) System.out.print(",");
                curr = curr.next;
            }
            System.out.print("]");
        } else if (obj instanceof String) {
            System.out.print("\\"" + obj + "\\"");
        } else {
            System.out.print(obj.toString());
        }
    }
}
`;
        return javaHeaders + code + javaWrapper;
    }

    return code;
};

module.exports = { generateWrapper };
