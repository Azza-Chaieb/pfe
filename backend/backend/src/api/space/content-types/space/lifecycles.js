"use strict";

const { errors } = require("@strapi/utils");
const { ApplicationError } = errors;

module.exports = {
    beforeCreate(event) {
        console.log("--- LifeCycle: beforeCreate triggered ---");
        console.log("Data:", event.params.data);
        validateSpaceData(event.params.data);
    },

    beforeUpdate(event) {
        console.log("--- LifeCycle: beforeUpdate triggered ---");
        console.log("Data:", event.params.data);
        validateSpaceData(event.params.data);
    },
};

function validateSpaceData(data) {
    if (!data) return;

    // Validate Capacity
    if (data.capacity !== undefined && data.capacity !== null) {
        const val = Number(data.capacity);
        if (isNaN(val) || val < 1) {
            console.log("Validation Failed: Capacity", val);
            throw new ApplicationError("La capacité doit être un nombre positif (au moins 1).");
        }
    }

    // Validate Pricing
    const pricingFields = ['pricing_hourly', 'pricing_daily', 'pricing_weekly', 'pricing_monthly'];
    pricingFields.forEach(field => {
        if (data[field] !== undefined && data[field] !== null) {
            const val = Number(data[field]);
            if (isNaN(val) || val < 0) {
                console.log("Validation Failed:", field, val);
                throw new ApplicationError(`Le prix (${field}) ne peut pas être négatif.`);
            }
        }
    });
}
