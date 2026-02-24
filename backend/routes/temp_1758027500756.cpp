// // #include <bits/stdc++.h>
// using namespace std;

// int main() {
//     ios::sync_with_stdio(false);
//     cin.tie(nullptr);

//     int n, target;
//     cin >> n;
//     vector<int> nums(n);
//     for (int i = 0; i < n; i++) cin >> nums[i];
//     cin >> target;

//     unordered_map<int, int> mp;
//     for (int i = 0; i < n; i++) {
//         int complement = target - nums[i];
//         if (mp.count(complement)) {
//             cout << "[" << mp[complement] << "," << i << "]";
//             return 0;
//         }
//         mp[nums[i]] = i; // store AFTER checking
//     }

//     cout << "[]";
//     return 0;
// }