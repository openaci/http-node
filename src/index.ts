import { Server } from 'http';
import { ACI } from "./aci";
import { AciConfig } from "./aci-config";

export class HttpAci extends ACI {
    private server: Server

    public constructor(config: AciConfig) {
        super(config)

        this.server = new Server(async (req, res) => {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', async () => {
                try {
                    const utterance = body.trim();
                    const response = await this.handle(utterance);

                    if (response.response_format.startsWith('structured')) {
                        res.writeHead(200, { 'Content-Type': `application/${response.response_format.split(':')[1]}` });
                        res.end(response.output);
                    } else if (response.response_format.startsWith('text')) {
                        res.writeHead(200, { 'Content-Type': `text/${response.response_format.split(':')[1]}` });
                        res.end(response.output);
                    } else {
                        res.writeHead(200, { 'Content-Type': 'text/plain' });
                        res.end(response.output);
                    }
                } catch (error) {
                    res.writeHead(500);
                    res.end(JSON.stringify({ error: 'Internal Server Error' }));
                    throw error;
                }
            });
        })
    }

    public listen(port: number, callback: () => void) {
        this.server.listen(port, callback)
    }

}