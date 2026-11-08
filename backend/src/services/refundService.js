/**
 * Calculate refund amount based on trip cancellation policy and departure time.
 * @param {Object} trip - The Trip document containing departureTime and cancellationPolicy
 * @param {Number} totalAmount - Total amount paid for the booking
 * @param {Date} [cancellationTime=new Date()] - Optional time of cancellation
 * @returns {Object} { refundPercentage, refundAmount, cancellationFee, hoursUntilDeparture }
 */
const calculateRefund = (trip, totalAmount, cancellationTime = new Date()) => {
  const departureTime = new Date(trip.departureTime);
  const cancelTime = new Date(cancellationTime);

  const diffMs = departureTime.getTime() - cancelTime.getTime();
  const hoursUntilDeparture = diffMs / (1000 * 60 * 60);

  if (hoursUntilDeparture <= 0) {
    // Trip has already departed or is at departure time
    return {
      refundPercentage: 0,
      refundAmount: 0,
      cancellationFee: totalAmount,
      hoursUntilDeparture: Math.max(0, hoursUntilDeparture)
    };
  }

  // Default fallback rules if not explicitly set on trip
  const rules = trip.cancellationPolicy?.rules && trip.cancellationPolicy.rules.length > 0
    ? [...trip.cancellationPolicy.rules].sort((a, b) => b.minHoursBefore - a.minHoursBefore)
    : [
        { minHoursBefore: 24, refundPercentage: 90 },
        { minHoursBefore: 12, refundPercentage: 50 },
        { minHoursBefore: 0, refundPercentage: 0 }
      ];

  let appliedRule = { minHoursBefore: 0, refundPercentage: 0 };

  for (const rule of rules) {
    if (hoursUntilDeparture >= rule.minHoursBefore) {
      appliedRule = rule;
      break;
    }
  }

  const refundPercentage = appliedRule.refundPercentage;
  const refundAmount = Math.round((totalAmount * refundPercentage) / 100);
  const cancellationFee = totalAmount - refundAmount;

  return {
    refundPercentage,
    refundAmount,
    cancellationFee,
    hoursUntilDeparture: Number(hoursUntilDeparture.toFixed(2))
  };
};

module.exports = { calculateRefund };

