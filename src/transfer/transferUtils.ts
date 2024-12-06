export function findClosestCombination(numbers: number[], target: number = 100): number[] {
    // 计算两个数的组合
    const findCombinations = (arr: number[], size: number): number[][] => {
        const combinations: number[][] = [];
        const generate = (start: number, combo: number[]) => {
            if (combo.length === size) {
                combinations.push([...combo]);
                return;
            }
            for (let i = start; i < arr.length; i++) {
                combo.push(arr[i]);
                generate(i + 1, combo);
                combo.pop();
            }
        };
        generate(0, []);
        return combinations;
    };

    // 找到最接近的组合
    const findClosestSum = (arr: number[][]): number[] => {
        let closestCombo: number[] = [];
        let closestSum = Infinity;

        for (const combo of arr) {
            const sum = combo.reduce((a, b) => a + b, 0);
            const diff = Math.abs(sum - target);
            if (diff < Math.abs(closestSum - target)) {
                closestCombo = combo;
                closestSum = sum;
            }
        }

        return closestCombo;
    };

    // 1. 先尝试 2 个数的组合
    let result = findClosestSum(findCombinations(numbers, 2));
    if (result.length === 0) {
        // 2. 如果没有 2 个数合适，尝试 3 个数的组合
        result = findClosestSum(findCombinations(numbers, 3));
    }
    if (result.length === 0) {
        // 3. 如果没有 3 个数合适，尝试 4 个数的组合
        result = findClosestSum(findCombinations(numbers, 4));
    }
    // 如果没有 4 个数合适，可以继续尝试更多的组合
    return result;
}


