def main():
    def twoSum(nums, target):
        seen = {}  # Dictionary to store number and its index
        
        for i in range(len(nums)):
            complement = target - nums[i]
            
            if complement in seen:
                return [seen[complement], i]
            
            seen[nums[i]] = i

if __name__ == "__main__":
    main()