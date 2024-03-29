import http from 'k6/http';
import { generateTestObjects, isExists } from "../helper.js";
import { check } from 'k6';

const bankAccountTestObjects = generateTestObjects({
    bankName: { type: "string", minLength: 5, maxLength: 15, notNull: true },
    bankAccountName: { type: "string", minLength: 5, maxLength: 15, notNull: true },
    bankAccountNumber: { type: "string", minLength: 5, maxLength: 15, notNull: true }
}, {
    bankName: "asdasdasd",
    bankAccountName: "asdasdasdasasdasd",
    bankAccountNumber: "asdasdasdasd"
})

const TEST_NAME = "(bank account test)"

export function BankAccountTest(user, doNegativeCase) {
    let res;
    if (doNegativeCase) {
        // Negative case, empty auth
        res = http.post(__ENV.BASE_URL + "/v1/bank/account", {}, { headers: { 'Content-Type': 'application/json' } })
        check(res, {
            [TEST_NAME + 'post bank account empty auth should return 401']: (r) => r.status === 401,
        })
        // Negative case, empty body 
        res = http.post(__ENV.BASE_URL + "/v1/bank/account", {}, { headers: { 'Content-Type': 'application/json', 'Authorization': "Bearer " + user.token } })
        check(res, {
            [TEST_NAME + 'post bank account empty body 400']: (r) => r.status === 400,
        })
        // Negative case, test all possible wrong values
        bankAccountTestObjects.forEach(objTest => {
            res = http.post(__ENV.BASE_URL + "/v1/bank/account", JSON.stringify(objTest), { headers: { 'Content-Type': 'application/json', 'Authorization': "Bearer " + user.token } })
            check(res, {
                [TEST_NAME + 'post bank account wrong value should return 400 |' + JSON.stringify(objTest)]: (r) => r.status === 400,
            })
        });
    }

    // Positive case, add bank account
    const updateBankAcc = {
        bankName: "Mandiri",
        bankAccountName: "Supriyati",
        bankAccountNumber: "00213415348123"
    }
    const createBankAcc = {
        bankName: "BCA Syariah",
        bankAccountName: "Supriyati",
        bankAccountNumber: "1241412311"
    }
    const headers = { headers: { 'Content-Type': 'application/json', 'Authorization': "Bearer " + user.token } }
    res = http.post(__ENV.BASE_URL + "/v1/bank/account", JSON.stringify(createBankAcc), headers)
    let isSuccess = check(res, {
        [TEST_NAME + 'create bank account should return 200']: (v) => v.status === 200
    })
    if (!isSuccess) return

    if (doNegativeCase) {
        // Negative case, empty auth
        res = http.get(__ENV.BASE_URL + "/v1/bank/account")
        check(res, {
            [TEST_NAME + 'empty auth should return 401']: (r) => r.status === 401,
        })
    }

    // Positive case
    res = http.get(__ENV.BASE_URL + "/v1/bank/account", { headers: { 'Content-Type': 'application/json', 'Authorization': "Bearer " + user.token } })
    isSuccess = check(res, {
        [TEST_NAME + 'get bank account should return 200']: (r) => r.status === 200,
        [TEST_NAME + 'get bank account should have at least one bank account']: (v) => {
            const res = isExists(v, "data")
            return Array.isArray(res) && res.length > 0
        }
    })
    if (!isSuccess) return

    const usrBankAccId = res.json().data[0].bankAccountId

    if (doNegativeCase) {
        // Negative case, empty auth
        res = http.patch(__ENV.BASE_URL + "/v1/bank/account", {}, { headers: { 'Content-Type': 'application/json' } })
        check(res, {
            [TEST_NAME + 'patch bank account empty auth should return 401']: (r) => r.status === 401,
        })
        // Negative case, empty path values 
        res = http.patch(__ENV.BASE_URL + "/v1/bank/account", {}, { headers: { 'Content-Type': 'application/json', 'Authorization': "Bearer " + user.token } })
        check(res, {
            [TEST_NAME + 'patch bank account empty path value should return 404']: (r) => r.status === 404,
        })
        // Negative case, wrong path values
        res = http.patch(__ENV.BASE_URL + "/v1/bank/account/sSIS12sd", {}, { headers: { 'Content-Type': 'application/json', 'Authorization': "Bearer " + user.token } })
        check(res, {
            [TEST_NAME + 'patch bank account wrong path value should return 404']: (r) => r.status === 404,
        })
        // Negative case, empty body 
        res = http.patch(__ENV.BASE_URL + "/v1/bank/account/" + usrBankAccId, {}, { headers: { 'Content-Type': 'application/json', 'Authorization': "Bearer " + user.token } })
        check(res, {
            [TEST_NAME + 'patch bank account empty body should return 400']: (r) => r.status === 400,
        })
        // Negative case, test all possible wrong values
        bankAccountTestObjects.forEach(objTest => {
            res = http.patch(__ENV.BASE_URL + "/v1/bank/account/" + usrBankAccId, JSON.stringify(objTest), { headers: { 'Content-Type': 'application/json', 'Authorization': "Bearer " + user.token } })
            check(res, {
                [TEST_NAME + 'patch bank account wrong value should return 400 |' + JSON.stringify(objTest)]: (r) => r.status === 400,
            })
        });
    }

    // Positive case
    res = http.patch(__ENV.BASE_URL + "/v1/bank/account/" + usrBankAccId, JSON.stringify(updateBankAcc), { headers: { 'Content-Type': 'application/json', 'Authorization': "Bearer " + user.token } })
    isSuccess = check(res, {
        [TEST_NAME + 'patch bank account should return 200']: (r) => r.status === 200,
    })
    if (!isSuccess) return

    res = http.get(__ENV.BASE_URL + "/v1/bank/account", { headers: { 'Content-Type': 'application/json', 'Authorization': "Bearer " + user.token } })
    isSuccess = check(res, {
        [TEST_NAME + 'get bank account after update should return 200']: (r) => r.status === 200,
        [TEST_NAME + 'get bank account should have at least one bank account']: (v) => {
            const res = isExists(v, "data");
            return Array.isArray(res) && res.length > 0;
        }
    })
    if (!isSuccess) return

    isSuccess = check(res, {
        [TEST_NAME + 'bank account should be updated']: (v) => {
            const res = isExists(v, "data")
            if (Array.isArray(res) && res.length > 0) {
                return res[0].bankName === updateBankAcc.bankName
            }
            return false
        },
        [TEST_NAME + 'bank account name should be updated']: (v) => {
            const res = isExists(v, "data")
            if (Array.isArray(res) && res.length > 0) {
                return res[0].bankAccountName === updateBankAcc.bankAccountName
            }
            return false
        },
        [TEST_NAME + 'bank account number should be updated']: (v) => {
            const res = isExists(v, "data")
            if (Array.isArray(res) && res.length > 0) {
                return res[0].bankAccountNumber === updateBankAcc.bankAccountNumber
            }
            return false
        },

    })
    if (!isSuccess) return

    user.bankAccounts.push(
        res.json().data[0]
    )
    return user
}