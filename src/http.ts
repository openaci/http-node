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

                console.debug('request body:', body)

                try {
                    const utterance = body.trim();
                    const response = await this.handle(utterance);

                    console.debug('intent handler response:', response)

                    if (response.output_format === 'image') {
                        res.writeHead(200, { 'Content-Type': 'image/png' });
                        res.end(Buffer.from(response.output, 'base64'));
                    } else if (response.output_format === 'structured') {
                        res.writeHead(200, { 'Content-Type': `application/${response.structured_format}` });
                        res.end(response.output);
                    } else {
                        res.writeHead(200, { 'Content-Type': 'text/plain' });
                        res.end(response.output);
                    }
                } catch (error) {
                    console.error('Error processing request:', error);
                    res.writeHead(500);
                    res.end(JSON.stringify({ error: 'Internal Server Error' }));
                }
            });
        })
    }

    public listen(port: number, callback: () => void) {
        this.server.listen(port, callback)
    }

}