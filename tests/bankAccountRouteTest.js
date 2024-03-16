import http from 'k6/http';
import { generateTestObjects } from "../helper.js";
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

const TEST_NAME = "(product test)"

export function BankAccountTest(user, doNegativeCase) {
    if (doNegativeCase) {
        // Negative case, empty auth
        let res = http.post(user.baseUrl + "/v1/bank/account", {}, { headers: { 'Content-Type': 'application/json' } })
        check(res, {
            [TEST_NAME + 'empty auth should return 401']: (r) => r.status === 401,
        })
        // Negative case, empty body 
        res = http.post(user.baseUrl + "/v1/bank/account", {}, { headers: { 'Content-Type': 'application/json', 'Authentication': "Bearer " + user.token } })
        check(res, {
            [TEST_NAME + 'empty body 400']: (r) => r.status === 400,
        })
        // Negative case, test all possible wrong values
        bankAccountTestObjects.forEach(objTest => {
            let res = http.post(user.baseUrl + "/v1/bank/account", objTest, { headers: { 'Content-Type': 'application/json', 'Authentication': "Bearer " + user.token } })
            check(res, {
                [TEST_NAME + 'wrong value should return 400']: (r) => r.status === 400,
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
        bankName: "BCA",
        bankAccountName: "Supriyati",
        bankAccountNumber: "1241412311"
    }
    res = http.post(user.baseUrl + "/v1/bank/account", createBankAcc, { headers: { 'Content-Type': 'application/json', 'Authentication': "Bearer " + user.token } })
    check(res, {
        [TEST_NAME + 'create bank account should return 200']: (v) => v.status === 200
    })

    if (doNegativeCase) {
        // Negative case, empty auth
        let res = http.get(user.baseUrl + "/v1/bank/account")
        check(res, {
            [TEST_NAME + 'empty auth should return 401']: (r) => r.status === 401,
        })
    }

    // Positive case
    res = http.get(user.baseUrl + "/v1/bank/account", { headers: { 'Content-Type': 'application/json', 'Authentication': "Bearer " + user.token } })
    check(res, {
        [TEST_NAME + 'get bank account should return 200']: (r) => r.status === 200,
        [TEST_NAME + 'get bank account should have at least one bank account']: (r) => r.body().data.length > 0
    })
    const usrBankAccId = res.body().data[0].bankAccountId

    if (doNegativeCase) {
        // Negative case, empty auth
        let res = http.patch(user.baseUrl + "/v1/bank/account", {}, { headers: { 'Content-Type': 'application/json' } })
        check(res, {
            [TEST_NAME + 'empty auth should return 401']: (r) => r.status === 401,
        })
        // Negative case, empty path values 
        res = http.patch(user.baseUrl + "/v1/bank/account", {}, { headers: { 'Content-Type': 'application/json', 'Authentication': "Bearer " + user.token } })
        check(res, {
            [TEST_NAME + 'empty path value should return 404']: (r) => r.status === 404,
        })
        // Negative case, wrong path values
        res = http.patch(user.baseUrl + "/v1/bank/account/sSIS12sd", {}, { headers: { 'Content-Type': 'application/json', 'Authentication': "Bearer " + user.token } })
        check(res, {
            [TEST_NAME + 'wrong path value should return 404']: (r) => r.status === 404,
        })
        // Negative case, empty body 
        res = http.patch(user.baseUrl + "/v1/bank/account/" + usrBankAccId, {}, { headers: { 'Content-Type': 'application/json', 'Authentication': "Bearer " + user.token } })
        check(res, {
            [TEST_NAME + 'empty body should return 400']: (r) => r.status === 400,
        })
        // Negative case, test all possible wrong values
        bankAccountTestObjects.forEach(objTest => {
            let res = http.patch(user.baseUrl + "/v1/bank/account/" + usrBankAccId, objTest, { headers: { 'Content-Type': 'application/json', 'Authentication': "Bearer " + user.token } })
            check(res, {
                [TEST_NAME + 'wrong value should return 400']: (r) => r.status === 400,
            })
        });
    }

    // Positive case
    res = http.patch(user.baseUrl + "/v1/bank/account/" + usrBankAccId, updateBankAcc, { headers: { 'Content-Type': 'application/json', 'Authentication': "Bearer " + user.token } })
    check(res, {
        [TEST_NAME + 'update bank account should return 200']: (r) => r.status === 200,
    })
    res = http.get(user.baseUrl + "/v1/bank/account", { headers: { 'Content-Type': 'application/json', 'Authentication': "Bearer " + user.token } })
    check(res, {
        [TEST_NAME + 'get bank account after update should return 200']: (r) => r.status === 200,
        [TEST_NAME + 'get bank account should have at least one bank account']: (r) => r.body().data.length > 0
    })
    check(res, {
        [TEST_NAME + 'bank account should be updated']: (v) => v.body().data[0].bankName === updateBankAcc.bankName,
        [TEST_NAME + 'bank account name should be updated']: (v) => v.body().data[0].bankAccountName === updateBankAcc.bankAccountName,
        [TEST_NAME + 'bank account number should be updated']: (v) => v.body().data[0].bankAccountNumber === updateBankAcc.bankAccountNumber
    })

    user.bankAccounts.push({
        ...res.body().data[0]
    })
}