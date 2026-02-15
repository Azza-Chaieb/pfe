import { errors } from "@strapi/utils";

const { ApplicationError } = errors;

export default {
    beforeCreate(event: any) {
        console.log("--- LifeCycle: beforeCreate triggered (TS) ---");
        console.log("Data:", event.params.data);
        validateSpaceData(event.params.data);
    },

    beforeUpdate(event: any) {
        console.log("--- LifeCycle: beforeUpdate triggered (TS) ---");
        console.log("Data:", event.params.data);
        validateSpaceData(event.params.data);
    },
};

function validateSpaceData(data: any) {
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
