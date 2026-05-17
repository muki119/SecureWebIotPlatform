import { useCallback, useRef } from "react";

export default function useDebounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number,
): (...args: Parameters<T>) => void {
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const funcRef = useRef(func);
    funcRef.current = func; // always call the latest func without it being a dep

    return useCallback(
        (...args: Parameters<T>) => {
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(() => funcRef.current(...args), delay);
        },
        [delay],
    );
}