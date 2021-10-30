export function storeSecret(key: string, value: string) {
    window.sessionStorage.setItem(key, value);
}

export function getSecret(key: string): string | null {
    return window.sessionStorage.getItem(key);
}

export function removeSecret(...keys: string[]) {
    keys.forEach(key => window.sessionStorage.removeItem(key))
}
