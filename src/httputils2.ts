class HttpRequest {
    constructor() {}

    async get(url: string, headers: Record<string, string> = {}): Promise<any> {
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...headers
                }
            });
            return await this.handleResponse(response);
        } catch (error: any) {
            throw new Error(`GET request failed: ${error.message}`);
        }
    }

    async post(url: string, headers: Record<string, string> = {}, data: any = {}): Promise<any> {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...headers
                },
                body: JSON.stringify(data)
            });
            return await this.handleResponse(response);
        } catch (error: any) {
            throw new Error(`POST request failed: ${error.message}`);
        }
    }

    private async handleResponse(response: Response): Promise<any> {
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
        }
        return await response.json();
    }
}

// 导出 HttpRequest 类
export default HttpRequest;
