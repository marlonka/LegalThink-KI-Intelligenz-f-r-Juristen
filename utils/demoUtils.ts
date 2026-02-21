export const fetchDemoFile = async (path: string, fileName: string): Promise<File> => {
    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`Failed to fetch demo file: ${response.statusText}`);
        }
        const text = await response.text();
        // Create a Blob from the text data and then instantiate a standard browser File object.
        const blob = new Blob([text], { type: 'text/markdown' });
        return new File([blob], fileName, { type: 'text/markdown', lastModified: Date.now() });
    } catch (error) {
        console.error("Error loading demo file:", error);
        throw error;
    }
};
