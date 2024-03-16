import http from 'k6/http';
import { generateRandomPassword, generateTestObjects, generateUniqueUsername } from "../helper";

const loginPayloadTestObjects = generateTestObjects({
    username: { type: "string", minLength: 5, maxLength: 15, notNull: true },
    password: { type: "string", minLength: 5, maxLength: 15, notNull: true }
}, {
    username: "asdasdasd",
    password: "asdasdasdasd"
})

const TEST_NAME = "(login test)"

export function LoginTest(user, doNegativeCase) {
    if (doNegativeCase) {
        // Negative case, empty body
        let res = http.post(user.baseUrl + "/v1/user/login", {}, { headers: { 'Content-Type': 'application/json' } })
        check(res, {
            [TEST_NAME + 'empty body should return 400']: (r) => r.status === 400,
        })

        // Negative case, test all possible wrong values
        loginPayloadTestObjects.forEach(objTest => {
            let res = http.post(user.baseUrl + "/v1/user/login", objTest, { headers: { 'Content-Type': 'application/json' } })
            check(res, {
                [TEST_NAME + 'wrong values should return 400']: (r) => r.status === 400,
            })
        });

        // Negative case, not found user
        res = http.post(user.baseUrl + "/v1/user/login", {
            username: generateUniqueUsername(),
            password: generateRandomPassword()
        }, { headers: { 'Content-Type': 'application/json' } })
        check(res, {
            [TEST_NAME + 'user not found should return 404']: (r) => r.status === 404,
        })

        // Negative case, wrong password 
        res = http.post(user.baseUrl + "/v1/user/login", {
            username: user.username,
            password: generateRandomPassword()
        }, { headers: { 'Content-Type': 'application/json' } })
        check(res, {
            [TEST_NAME + 'wrong password should return 400']: (r) => r.status === 400,
        })
    }

    // Positive case 6
    res = http.post(user.baseUrl + "/v1/user/login", {
        username: user.username,
        password: user.password
    }, { headers: { 'Content-Type': 'application/json' } })
    check(res, {
        [TEST_NAME + 'correct user should return 200']: (r) => r.status === 200,
        [TEST_NAME + 'current user should have name exists and correct']: (r) => r.body().data.name && r.body().data.name === user.name,
        [TEST_NAME + 'current user should have username exists and correct']: (r) => r.body().username && r.body().data.username === user.username,
        [TEST_NAME + 'current user should have token exists']: (r) => r.body().accessToken
    })

    user.name = res.body().data.name
    user.username = res.body().data.username
    user.token = res.body().data.accessToken
}