/**
 * Verification script for printing service calculation.
 * It creates a booking with fallback-print and checks if the price is correctly calculated.
 */
const { createStrapi } = require("@strapi/strapi");

async function verify() {
  const app = await createStrapi({ distDir: "./dist" }).load();
  try {
    console.log("Strapi loaded.");

    // 1. Find a space
    const spaces = await app.documents('api::space.space').findMany({ limit: 1 });
    const space = spaces[0];
    if (!space) {
      console.log("No space found to test with.");
      return;
    }
    console.log(`Testing with Space: ${space.name} (${space.documentId})`);

    // 2. Prepare booking data with fallback-print
    // pages=10, copies=3, price=0.2 => expected service subtotal = 10 * 3 * 0.2 = 6.0
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour duration

    const bookingData = {
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      status: 'pending',
      space: space.documentId,
      extras: {
        serviceQtys: {
          "fallback-print": 1, // Quantity of the service itself
        },
        serviceParams: {
          "fallback-print": [
            {
              pages: 10,
              copies: 3
            }
          ]
        }
      }
    };

    console.log("Creating booking with fallback-print (10 pages, 3 copies)...");
    const booking = await app.documents('api::booking.booking').create({
      data: bookingData
    });

    console.log(`Booking created. ID: ${booking.id}, Total Price: ${booking.total_price}`);

    // Calculate expected price:
    // Base space price: depends on space.pricing_hourly or pricing_daily.
    // Let's assume hourly for 1 hour.
    const pHourly = parseFloat(space.pricing_hourly || 0);
    const expectedServicePrice = 10 * 3 * 0.2;
    const expectedBasePrice = pHourly * 1; // 1 hour, 1 participant (default)
    const expectedTotal = expectedBasePrice + expectedServicePrice;

    console.log(`Expected Base Space Price: ${expectedBasePrice}`);
    console.log(`Expected Service Price: ${expectedServicePrice}`);
    console.log(`Expected Total: ${expectedTotal.toFixed(2)}`);

    if (Math.abs(booking.total_price - expectedTotal) < 0.01) {
      console.log("✅ SUCCESS: Printing calculation is correct!");
    } else {
      console.log(`❌ FAILURE: Price mismatch. Got ${booking.total_price}, expected around ${expectedTotal.toFixed(2)}`);
    }

    // Cleanup
    await app.documents('api::booking.booking').delete({ documentId: booking.documentId });
    console.log("Test booking deleted.");

  } catch (err) {
    console.error("Verification failed:", err);
  } finally {
    process.exit(0);
  }
}

verify();
