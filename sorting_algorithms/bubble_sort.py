def bubble_sort(arr):
    steps = []
    n = len(arr)
    for i in range(n):
        for j in range(n-i-1):
            steps.append(arr.copy())
            if arr[j] > arr[j+1]:
                arr[j], arr[j+1] = arr[j+1], arr[j]
    steps.append(arr.copy())  # Capture the final sorted array
    return arr, steps
