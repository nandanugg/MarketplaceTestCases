import { check } from 'k6';
import { generateTestObjects, generateUniqueName, generateRandomPassword, generateUniqueUsername, isEqual, isExists } from "../helper.js";
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
        res = http.post(__ENV.BASE_URL + "/v1/user/register", {}, { headers: { 'Content-Type': 'application/json' } })
        check(res, {
            [TEST_NAME + 'post register empty body should return 400']: (r) => r.status === 400,
        })

        // Negative case, test all possible wrong values
        registerPayloadTestObjects.forEach(objTest => {
            res = http.post(__ENV.BASE_URL + "/v1/user/register", JSON.stringify(objTest), { headers: { 'Content-Type': 'application/json' } })
            check(res, {
                [TEST_NAME + 'post register wrong value should return 400 | ' + JSON.stringify(objTest)]: (r) => r.status === 400,
            })
        });
    }

    // Positive case 6
    const usr = {
        username: generateUniqueUsername(),
        password: generateRandomPassword(),
        name: generateUniqueName()
    }
    const postitivePayload = JSON.stringify(usr)
    res = http.post(__ENV.BASE_URL + "/v1/user/register", postitivePayload, { headers: { 'Content-Type': 'application/json' } })

    const isSucceed = check(res, {
        [TEST_NAME + 'correct user shoud return 201|' + postitivePayload]: (r) => r.status === 201,
        [TEST_NAME + 'current user should have name exists and correct']: (r) => isEqual(r, "data.name", usr.name),
        [TEST_NAME + 'current user should have username exists and correct']: (r) => isEqual(r, "data.username", usr.username),
        [TEST_NAME + 'current user should have token exists']: (r) => isExists(r, "data.accessToken")
    })
    if (!isSucceed) return

    user.name = res.json().data.name
    user.username = res.json().data.username
    user.password = usr.password
    user.token = res.json().data.accessToken

    if (doNegativeCase) {
        // Negative case, username exists
        res = http.post(__ENV.BASE_URL + "/v1/user/register", JSON.stringify({
            username: usr.username,
            name: generateUniqueName(),
            password: generateRandomPassword()
        }), { headers: { 'Content-Type': 'application/json' } })
        check(res, {
            [TEST_NAME + 'post register username exists should return 409']: (v) => v.status === 409
        })
    }
    return user
}