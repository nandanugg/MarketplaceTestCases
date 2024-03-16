import http from 'k6/http';
import { check } from 'k6';
const TEST_NAME = "(upload test)"

// Prepare the payload using the file to be uploaded
var payload = {
    file: http.file(open('../figure/image15KB.jpg', 'b'), 'image1.jpg'),
};
export function UploadTest(user, doNegativeCase) {
    let res;
    var url = user.baseUrl + '/v1/image';
    if (doNegativeCase) {
        // Negative case, empty auth
        res = http.post(url, JSON.stringify({}), {});
        check(res, {
            [TEST_NAME + "post upload file empty auth should return 401"]: (v) => v.status === 401
        })
        // Negative case, empty file 
        res = http.post(url, JSON.stringify({}), { headers: { 'Authorization': "Bearer " + user.token } });
        check(res, {
            [TEST_NAME + "post upload file empty file should return 400"]: (v) => v.status === 400
        })
    }

    // Positive case
    res = http.post(url, payload, { headers: { 'Authorization': "Bearer " + user.token } });
    check(res, {
        [TEST_NAME + "correct file should return 200"]: (v) => v.status === 200,
        [TEST_NAME + "correct file should have imageUrl"]: (v) => v.body().imageUrl,
    })

    user.imageUrls.push(res.body().imageUrl)
}