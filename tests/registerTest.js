import { check } from 'k6';
import { generateTestObjects, generateUniqueName, generateRandomPassword, generateUniqueUsername } from "../helper.js";
import http from 'k6/http';

const registerPayloadTestObjects = generateTestObjects({
    username: { type: "string", minLength: 5, maxLength: 15, notNull: true },
    name: { type: "string", minLength: 5, maxLength: 50, notNull: true },
    password: { type: "string", minLength: 5, maxLength: 15, notNull: true }
}, {
    username: "asdasdasd",
    name: "asdasdasdasasdasd",
    password: "asdasdasdasd"
})


const TEST_NAME = "(register test)"

export function RegistrationTest(user, doNegativeCase) {
    let res;
    if (doNegativeCase) {
        // Negative case, test empty body
        res = http.post(user.baseUrl + "/v1/user/register", {}, { headers: { 'Content-Type': 'application/json' } })
        check(res, {
            [TEST_NAME + 'empty body should return 400']: (r) => r.status === 400,
        })

        // Negative case, test all possible wrong values
        registerPayloadTestObjects.forEach(objTest => {
            res = http.post(user.baseUrl + "/v1/user/register", objTest, { headers: { 'Content-Type': 'application/json' } })
            check(res, {
                [TEST_NAME + 'wrong value should return 400']: (r) => r.status === 400,
            })
        });
    }

    // Positive case 6
    const genUsrname = generateUniqueUsername()
    res = http.post(user.baseUrl + "/v1/user/register", {
        username: genUsrname,
        name: generateUniqueName(),
        password: generateRandomPassword()
    }, { headers: { 'Content-Type': 'application/json' } })

    check(res, {
        [TEST_NAME + 'correct user shoud return 200']: (r) => r.status === 200,
        [TEST_NAME + 'correct user should return name']: (r) => r.body().data.name,
        [TEST_NAME + 'correct user should return username']: (r) => r.body().username,
        [TEST_NAME + 'correct user should return accessToken']: (r) => r.body().accessToken
    })

    user.name = res.body().data.name
    user.username = res.body().data.username
    user.token = res.body().data.accessToken

    if (doNegativeCase) {
        // Negative case, username exists
        res = http.post(user.baseUrl + "/v1/user/register", {
            username: genUsrname,
            name: generateUniqueName(),
            password: generateRandomPassword()
        }, { headers: { 'Content-Type': 'application/json' } })
        check(res, {
            [TEST_NAME + 'username exists should return 409']: (v) => v.status === 409
        })
    }
}