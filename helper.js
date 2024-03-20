/**
 * Checks wether k6 response have the data that query asks
 * @param {import("k6/http").RefinedResponse<ResponseType | undefined>} v 
 * @param {string} query 
 */
export function isExists(v, query) {
    const splittedQuery = query.split(".")
    const json = v.json()
    let val;
    if (json) {
        val = json
        splittedQuery.forEach(query => {
            const v = val[query]
            if (!v) {
                return false
            }
            if (typeof v === "boolean") {
                val = v.toString()
            } else {
                val = v
            }
        });
        return val
    }
    return false
}

/**
 * Checks wether k6 response have the data that query asks and match it
 * @param {import("k6/http").RefinedResponse<ResponseType | undefined >} v 
 * @param {string} query 
 * @param {any} expected 
 * @returns 
 */
export function isEqual(v, query, expected) {
    const i = isExists(v, query)
    let e = expected
    if (typeof expected === "boolean") {
        e = e.toString()
    }
    return i && i === e
}


export function generateRandomPassword() {
    const length = Math.floor(Math.random() * 11) + 5; // Random length between 5 and 15
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        password += characters.charAt(randomIndex);
    }

    return password;
}

export function generateUniqueUsername() {
    // Define parts of names for generating random names
    const prefixes = ['An', 'Ben', 'Jon', 'Xen', 'Lor', 'Sam', 'Max', 'Jen', 'Leo', 'Kay', 'Alex', 'Eva', 'Zoe'];
    const middles = ['dra', 'vi', 'na', 'lo', 'ki', 'sa', 'ra', 'li', 'mo', 'ne', 'ja', 'mi', 'ko'];
    const suffixes = ['son', 'ton', 'ly', 'en', 'er', 'an', 'ry', 'ley', 'leigh', 'sie', 'den', 'leya', 'vin', 'lyn', 'ley', 'don'];

    let username = '';
    while (username.length < 5 || username.length > 15) {
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const middle = middles[Math.floor(Math.random() * middles.length)];
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        username = prefix + middle + suffix + Math.floor(Math.random() * 10000);
    }

    return username;
}
export function generateUniqueName() {
    // Define parts of names for generating random names
    const prefixes = ['An', 'Ben', 'Jon', 'Xen', 'Lor', 'Sam', 'Max', 'Jen', 'Leo', 'Kay'];
    const middles = ['dra', 'vi', 'na', 'lo', 'ki', 'sa', 'ra', 'li', 'mo', 'ne'];
    const suffixes = ['son', 'ton', 'ly', 'en', 'er', 'an', 'ry', 'ley', 'leigh', 'sie'];

    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const middle = middles[Math.floor(Math.random() * middles.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    const name = prefix + " " + middle + " " + suffix;

    return name;
}

export function generateTestObjects(schema, validTemplate) {
    const violations = [];

    function clone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    function addViolation(path, violation) {
        const testCase = clone(validTemplate);
        let parts = path.split('.');
        let subObject = testCase;
        for (let i = 0; i < parts.length - 1; i++) {
            if (parts[i].endsWith(']')) {
                let index = parts[i].match(/\[(\d+)\]/)[1];
                parts[i] = parts[i].replace(/\[\d+\]/, '');
                subObject = subObject[parts[i]][index];
            } else {
                subObject = subObject[parts[i]];
            }
        }
        let lastPart = parts[parts.length - 1];
        if (lastPart.endsWith(']')) {
            let index = lastPart.match(/\[(\d+)\]/)[1];
            lastPart = lastPart.replace(/\[\d+\]/, '');
            subObject[lastPart][index] = violation;
        } else {
            subObject[lastPart] = violation;
        }
        violations.push(testCase);
    }

    function generateDataTypeViolations(propPath, type) {
        const dataTypes = {
            'string': ["", 123, true, {}, []],
            'number': ["notANumber", true, {}, []],
            'boolean': ["notABoolean", 123, {}, []],
            'object': ["notAnObject", 123, true, []], // Assuming a non-empty object is valid
            'array': ["notAnArray", 123, true, {}]
        };

        dataTypes[type].forEach(violation => {
            addViolation(propPath, violation);
        });
    }

    function generateViolationsForProp(propPath, propRules, parentValue) {
        if (propRules.notNull) {
            addViolation(propPath, null);
        }
        if (propRules.isUrl) {
            addViolation(propPath, "notAUrl");
            addViolation(propPath, "http://incomplete");
        }
        if (propRules.type) {
            generateDataTypeViolations(propPath, propRules.type);
        }
        switch (propRules.type) {
            case 'string':
                if (propRules.minLength !== undefined) {
                    addViolation(propPath, 'a'.repeat(propRules.minLength - 1));
                }
                if (propRules.maxLength !== undefined) {
                    addViolation(propPath, 'a'.repeat(propRules.maxLength + 1));
                }
                if (propRules.enum !== undefined) {
                    addViolation(propPath, 'notAnEnumValue');
                }
                break;
            case 'number':
                if (propRules.min !== undefined) {
                    addViolation(propPath, propRules.min - 1);
                }
                if (propRules.max !== undefined) {
                    addViolation(propPath, propRules.max + 1);
                }
                break;
            case 'array':
                if (propRules.items && propRules.items.notNull) {
                    addViolation(`${propPath}[0]`, null); // Violates notNull for array items
                }
                if (propRules.items && propRules.items.type === 'string') {
                    // Already handled by generateDataTypeViolations
                }
                break;
            case 'object':
                if (propRules.properties) {
                    Object.entries(propRules.properties).forEach(([nestedProp, nestedRules]) => {
                        generateViolationsForProp(`${propPath}.${nestedProp}`, nestedRules, parentValue[nestedProp]);
                    });
                }
                break;
        }
    }

    Object.entries(schema).forEach(([prop, propRules]) => {
        generateViolationsForProp(prop, propRules, validTemplate[prop]);
    });

    return violations;
}