import * as amqp from 'amqplib';
import { Connection, Channel } from 'amqplib';

class RabbitMQService {
    private connection: Connection | null = null;
    private channel: Channel | null = null;
    private url: string;

    constructor() {
        this.url = process.env.RABBITMQ_URL ?? 'amqp://localhost';
    }

    public async connect(): Promise<void> {
        try {
            this.connection = await amqp.connect(this.url);
            this.channel = await this.connection.createChannel();
            console.log('RabbitMQ connected successfully');
        } catch (error) {
            console.error('RabbitMQ connection failed:', error);
        }
    }

    public async disconnect(): Promise<void> {
        if (this.connection) {
            await this.connection.close();
            console.log('RabbitMQ disconnected');
        }
    }

    public async sendToQueue(queue: string, message: any): Promise<void> {
        if (!this.channel) {
            console.warn('RabbitMQ channel not ready');
            return;
        }

        try {
            await this.channel.assertQueue(queue, { durable: true });
            this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), { persistent: true });

        } catch (error) {
            console.error(`Failed to send to queue ${queue}:`, error);
        }
    }

    public async consume(queue: string, callback: (msg: any) => void): Promise<void> {
        if (!this.channel) return;

        try {
            await this.channel.assertQueue(queue, { durable: true });
            this.channel.consume(queue, (msg) => {
                if (msg) {
                    const content = JSON.parse(msg.content.toString());
                    callback(content);
                    this.channel?.ack(msg);
                }
            });
        } catch (error) {
            console.error(`Error consuming queue ${queue}:`, error);
        }
    }
}

export const rabbitMQService = new RabbitMQService();
