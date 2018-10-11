const moment = require('moment');
const R = require('ramda');

const MONTHS_IN_YEAR = 12;

const getDataForDates = ({ stockData, periodStartDate, periodCadenceInMonths }) => {
    const numberOfPeriods = MONTHS_IN_YEAR / periodCadenceInMonths;

    const periodStartDateMoment = moment(periodStartDate);
    let currentPeriodEndDate = periodStartDateMoment;
    const dataForPeriodEndDates = R.reduce(
        (accum, dataForDay) => {
            if (
                moment(dataForDay.date) >= currentPeriodEndDate &&
                accum.length < numberOfPeriods + 1
            ) {
                accum.push(R.merge(
                    { esppPeriodDate: currentPeriodEndDate.format('YYYY-MM-DD') },
                    dataForDay
                ));
                currentPeriodEndDate = currentPeriodEndDate.add(periodCadenceInMonths, 'months');
            }
            return accum;
        },
        [],
        stockData
    );

    return R.zip(
        R.init(dataForPeriodEndDates),
        R.tail(dataForPeriodEndDates),
    );
};

const SHARE_PERCENTAGE = 0.5;
const ESPP_MAX_CONTRIB_PER_YEAR = 25000;

const calculateESPPEarnings = ({
    stockData,
    periodStartDate,
    income,
    lookback,
    periodCadenceInMonths,
    discount,
    contributionPercentage
}) => {
    const numberOfPeriods = MONTHS_IN_YEAR / periodCadenceInMonths;
    const contributionPerPeriod = Math.min(
        contributionPercentage * income / numberOfPeriods,
        ESPP_MAX_CONTRIB_PER_YEAR / numberOfPeriods
    );

    const earnings = R.map(
        ([ periodStart, periodEnd ]) => {
            const priceOfStock = periodEnd.open;
            const buyPriceOfStock = lookback ? Math.min(periodStart.open, periodEnd.open) : periodEnd.open;

            const discountedPurchasePrice = (1 - discount) * buyPriceOfStock;
            const stockBought = Math.floor(contributionPerPeriod / discountedPurchasePrice);
            const moneyUsedToBuyStock = stockBought * discountedPurchasePrice;
            const unusedMoney = contributionPerPeriod - moneyUsedToBuyStock;
            const totalSalePrice = stockBought * priceOfStock;
            const gain = totalSalePrice - moneyUsedToBuyStock;
            const amountToPayBack = contributionPerPeriod + SHARE_PERCENTAGE * gain;
            const cashInBankAfterSale = totalSalePrice + unusedMoney;
            const moneyMadeByClient = cashInBankAfterSale - amountToPayBack;
            const moneyMadeByCake = amountToPayBack - contributionPerPeriod;
            return {
                amountToPayBack,
                buyPriceOfStock,
                cashInBankAfterSale,
                contributionPerPeriod,
                discountedPurchasePrice,
                gain,
                unusedMoney,
                moneyUsedToBuyStock,
                moneyMadeByCake,
                moneyMadeByClient,
                periodEnd,
                periodStart,
                priceOfStock,
                stockBought,
                totalSalePrice,
            };
        },
        getDataForDates({ stockData, periodStartDate, periodCadenceInMonths })
    );

    return earnings;
};

module.exports = {
    calculateESPPEarnings,
    getDataForDates,
};