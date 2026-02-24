def twoSum(nums, target):
    seen = {}
    
    for i in range(len(nums)):
        complement = target - nums[i]
        
        if complement in seen:
            return [seen[complement], i]
        
        seen[nums[i]] = i


def main():
    n = int(input())                 # Size of array
    nums = list(map(int, input().split()))  # Array elements
    target = int(input())            # Target value
    
    result = twoSum(nums, target)
    
    if result:
        print(result[0], result[1])
    else:
        print("No solution")


if __name__ == "__main__":
    main()