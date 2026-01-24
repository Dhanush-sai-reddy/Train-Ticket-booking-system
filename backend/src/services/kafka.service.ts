import { Kafka, Producer, Consumer } from 'kafkajs';

class KafkaService {
    private kafka: Kafka;
    private producer: Producer;
    private consumer: Consumer;
    private isConnected: boolean = false;

    constructor() {
        this.kafka = new Kafka({
            clientId: 'railrover-backend',
            brokers: (process.env.KAFKA_BROKER || 'localhost:9092').split(',')
        });
        this.producer = this.kafka.producer();
        this.consumer = this.kafka.consumer({ groupId: 'railrover-group' });
    }

    public async connect(): Promise<void> {
        try {
            await this.producer.connect();
            await this.consumer.connect();
            this.isConnected = true;
            console.log('Kafka connected successfully');
        } catch (error) {
            console.error('Kafka connection failed:', error);
        }
    }

    public async disconnect(): Promise<void> {
        if (this.isConnected) {
            await this.producer.disconnect();
            await this.consumer.disconnect();
            this.isConnected = false;
            console.log('Example: Kafka disconnected');
        }
    }

    public async publish(topic: string, message: any): Promise<void> {
        if (!this.isConnected) {
            console.warn('Kafka not connected, skipping publish');
            return;
        }
        try {
            await this.producer.send({
                topic,
                messages: [
                    { value: JSON.stringify(message) }
                ],
            });
            // console.log(`Example: Published to ${topic}`, message);
        } catch (error) {
            console.error(`Failed to publish to ${topic}:`, error);
        }
    }

    public async subscribe(topic: string, callback: (message: any) => void): Promise<void> {
        if (!this.isConnected) return;

        await this.consumer.subscribe({ topic, fromBeginning: false });

        await this.consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                if (message.value) {
                    const content = JSON.parse(message.value.toString());
                    callback(content);
                }
            },
        });
    }
}

export const kafkaService = new KafkaService();
