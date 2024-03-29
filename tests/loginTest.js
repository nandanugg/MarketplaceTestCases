import http from 'k6/http';
import { check } from 'k6';
import { generateRandomPassword, generateTestObjects, generateUniqueUsername, isEqual, isExists } from "../helper.js";

const loginPayloadTestObjects = generateTestObjects({
    username: { type: "string", minLength: 5, maxLength: 15, notNull: true },
    password: { type: "string", minLength: 5, maxLength: 15, notNull: true }
}, {
    username: "asdasdasd",
    password: "asdasdasdasd"
})

const TEST_NAME = "(login test)"

export function LoginTest(user, doNegativeCase) {
    let res;
    if (doNegativeCase) {
        // Negative case, empty body
        res = http.post(__ENV.BASE_URL + "/v1/user/login", {}, { headers: { 'Content-Type': 'application/json' } })
        check(res, {
            [TEST_NAME + 'post login empty body should return 400']: (r) => r.status === 400,
        })

        // Negative case, test all possible wrong values
        loginPayloadTestObjects.forEach(objTest => {
            res = http.post(__ENV.BASE_URL + "/v1/user/login", JSON.stringify(objTest), { headers: { 'Content-Type': 'application/json' } })
            check(res, {
                [TEST_NAME + 'post login wrong values should return 400']: (r) => r.status === 400,
            })
        });

        // Negative case, not found user
        res = http.post(__ENV.BASE_URL + "/v1/user/login", JSON.stringify({
            username: generateUniqueUsername(),
            password: generateRandomPassword()
        }), { headers: { 'Content-Type': 'application/json' } })
        check(res, {
            [TEST_NAME + 'post login user not found should return 404']: (r) => r.status === 404,
        })

        // Negative case, wrong password 
        res = http.post(__ENV.BASE_URL + "/v1/user/login", JSON.stringify({
            username: user.username,
            password: generateRandomPassword()
        }), { headers: { 'Content-Type': 'application/json' } })
        check(res, {
            [TEST_NAME + 'post login wrong password should return 400']: (r) => r.status === 400,
        })
    }

    // Positive case 6
    const postitivePayload = JSON.stringify({
        username: user.username,
        password: user.password
    })
    res = http.post(__ENV.BASE_URL + "/v1/user/login", postitivePayload, { headers: { 'Content-Type': 'application/json' } })
    const isSucceed = check(res, {
        [TEST_NAME + 'correct user should return 200|' + postitivePayload]: (r) => r.status === 200,
        [TEST_NAME + 'current user should have name exists and correct']: (r) => isEqual(r, "data.name", user.name),
        [TEST_NAME + 'current user should have username exists and correct']: (r) => isEqual(r, "data.username", user.username),
        [TEST_NAME + 'current user should have token exists']: (r) => isExists(r, "data.accessToken")
    })

    if (!isSucceed) return

    user.name = res.json().data.name
    user.username = res.json().data.username
    user.token = res.json().data.accessToken
    return user
}