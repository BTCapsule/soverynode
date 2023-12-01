import express from 'express';
import bodyParser from 'body-parser';
import multer from 'multer';
const app = express();
const upload = multer({ dest: '/tmp' });
const rawBodyParser = bodyParser.raw({
    inflate: false,
    type: '*/*'
});
/**
 * Take the payload given then return it
 * Integration test can then verify its the same as what was sent
 */
const returnJsonPayloadHandler = (request, response) => {
    const payload = JSON.parse(request.body);
    response.send(payload);
};
app.get('/', (request, response) => {
    response.send(`
        <html><head></head><body></body>Expose.sh test site</html>
    `);
});
app.get('/json', (request, response) => {
    const data = {
        "test": "test"
    };
    response.send(data);
});
app.post('/api-post', rawBodyParser, returnJsonPayloadHandler);
app.put('/api-put', rawBodyParser, returnJsonPayloadHandler);
app.post('/image-upload', rawBodyParser, (request, response) => {
    const body = request.body;
    // Send the received image back, to be compared with Buffer.compare()
    response.send(body);
});
app.post('/post-submit-form', rawBodyParser, (request, response) => {
    const body = request.body;
    const data = new URLSearchParams(body.toString());
    const returnData = {
        firstName: data.get('firstName')
    };
    response.send(returnData);
});
app.post('/post-submit-form-multipart-with-image', upload.single('photo'), (request, response) => {
    response.send({
        firstName: request.body.firstName,
        filename: request.file.originalname
    });
});
export { app };
//# sourceMappingURL=app.js.map