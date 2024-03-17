import http from 'k6/http';
import { check } from 'k6';
import { generateTestObjects, generateUniqueName } from "../helper.js"

const addProductPayloadTestObjects = generateTestObjects({
    name: { type: "string", minLength: 5, maxLength: 60, notNull: true },
    price: { type: "number", min: 0, notNull: true },
    imageUrl: { type: "string", isUrl: true, notNull: true },
    stock: { type: "number", min: 0, notNull: true },
    condition: { type: "string", enum: ["new", "second"], notNull: true },
    tags: { type: "array", items: { type: "string" }, notNull: true },
    isPurchaseable: { type: "boolean", notNull: true }
}, {
    name: "burhans",
    price: 1000,
    imageUrl: "http://imageUrl.jpg",
    stock: 10,
    condition: "new",
    tags: ["barucyn"],
    isPurchaseable: true
})


const TEST_NAME = "(product test)"

export function ProductTest(user, doNegativeCase) {
    let res;
    if (doNegativeCase) {
        // Negative case, empty auth
        res = http.post(__ENV.BASE_URL + "/v1/product", JSON.stringify({}), { headers: { 'Content-Type': 'application/json' } })
        check(res, {
            [TEST_NAME + 'post product empty auth should return 401']: (r) => r.status === 401,
        })
        // Negative case, empty body 
        res = http.post(__ENV.BASE_URL + "/v1/product", JSON.stringify({}), { headers: { 'Content-Type': 'application/json', 'Authorization': "Bearer " + user.token } })
        check(res, {
            [TEST_NAME + 'post product empty body should return 400']: (r) => r.status === 400,
        })
        // Negative case, test all possible wrong values
        addProductPayloadTestObjects.forEach(objTest => {
            res = http.post(__ENV.BASE_URL + "/v1/product", JSON.stringify(objTest), { headers: { 'Content-Type': 'application/json', 'Authorization': "Bearer " + user.token } })
            check(res, {
                [TEST_NAME + 'post product wrong value should return 400 |' + JSON.stringify(objTest)]: (r) => r.status === 400,
            })
        });
    }

    // Positive case
    res = http.post(__ENV.BASE_URL + "/v1/product", JSON.stringify({
        name: generateUniqueName(),
        price: 1000,
        imageUrl: user.imageUrls[0],
        stock: 10,
        condition: "new",
        tags: ["okbeli"],
        isPurchaseable: true
    }), { headers: { 'Content-Type': 'application/json', 'Authorization': "Bearer " + user.token } })
    check(res, {
        [TEST_NAME + 'correct create product should return 200']: (r) => r.status === 200,
    })
    return user
}