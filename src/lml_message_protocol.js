class LMLFun {
    uuidv4 () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : ((r & 0x3) | 0x8);
            return v.toString(16);
        });
    }

    lmlRequest (operation, args) {
        const messageId = this.uuidv4();

        return new Promise((resolve, reject) => {
            let bc_request = new BroadcastChannel('channel-request');
            let bc_response = new BroadcastChannel('channel-response');
            bc_request.postMessage({
                message_id: messageId,
                operation: operation,
                args: args
            });
            bc_request.close();
            bc_response.addEventListener('message', ev => {
                if (ev.data.message_id !== messageId) resolve('NONE');
                resolve(ev.data.result);
                bc_response.close();
            });
        });
    }
}

module.exports = LMLFun;
