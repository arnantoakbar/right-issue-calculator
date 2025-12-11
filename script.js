// Stock data is loaded from stock-data.js

// DOM Elements
const themeToggleBtn = document.getElementById('theme-toggle');
const ratioOldInput = document.getElementById('ratio-old');
const ratioNewInput = document.getElementById('ratio-new');
const rightPriceInput = document.getElementById('right-price');

const currentSharesInput = document.getElementById('current-shares');
const currentAvgPriceInput = document.getElementById('current-avg-price');
const currentTotalValueDisplay = document.getElementById('current-total-value');

const newSharesCountDisplay = document.getElementById('new-shares-count');
const newAvgPriceDisplay = document.getElementById('new-avg-price');
const newTotalValueDisplay = document.getElementById('new-total-value');

const finalSharesDisplay = document.getElementById('final-shares');
const finalAvgPriceDisplay = document.getElementById('final-avg-price');
const finalTotalValueDisplay = document.getElementById('final-total-value');

const cumDatePriceInput = document.getElementById('cum-date-price');
const conclusionNewSharesDisplay = document.getElementById('conclusion-new-shares');
const conclusionExercisePriceDisplay = document.getElementById('conclusion-exercise-price');
const conclusionRatioDisplay = document.getElementById('conclusion-ratio');
const conclusionTotalCostDisplay = document.getElementById('conclusion-total-cost');
const conclusionNewAvgPriceDisplay = document.getElementById('conclusion-new-avg-price');
const theoreticalPriceDisplay = document.getElementById('theoretical-price');
const recommendationBox = document.getElementById('recommendation-box');
const recommendationText = document.getElementById('recommendation-text');

const calculateBtn = document.getElementById('calculate-btn');

// State
let state = {
    ratioOld: 0,
    ratioNew: 0,
    rightPrice: 0,
    currentShares: 0,
    currentAvgPrice: 0,
    cumDatePrice: 0
};

// Initialization
function init() {
    initTheme();
    setupEventListeners();
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function setupEventListeners() {
    themeToggleBtn.addEventListener('click', toggleTheme);

    const allInputs = [
        rightPriceInput, currentAvgPriceInput, cumDatePriceInput,
        currentSharesInput, ratioOldInput, ratioNewInput
    ];

    // Scroll to input on focus
    allInputs.forEach(input => {
        input.addEventListener('focus', (e) => {
            // Small delay to allow keyboard to appear
            setTimeout(() => {
                e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        });
    });

    // Inputs that require currency formatting
    [rightPriceInput, currentAvgPriceInput, cumDatePriceInput].forEach(input => {
        input.addEventListener('input', (e) => handleCurrencyInput(e));
    });

    // Inputs that require number formatting (shares)
    currentSharesInput.addEventListener('input', (e) => handleNumberInput(e));

    // Ratio inputs
    [ratioOldInput, ratioNewInput].forEach(input => {
        input.addEventListener('input', (e) => handleRatioInput(e));
    });

    calculateBtn.addEventListener('click', calculate);
}

// Input Handlers
function handleRatioInput(e) {
    // Remove non-numeric characters but allow one decimal point (dot or comma)
    let value = e.target.value.replace(/[^0-9.,]/g, '');

    // Replace comma with dot
    value = value.replace(/,/g, '.');

    // Prevent multiple decimal points
    const parts = value.split('.');
    if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
    }

    // Limit to reasonable length (e.g. 10 chars) to prevent overflow but allow precision
    if (value.length > 10) {
        value = value.slice(0, 10);
    }

    e.target.value = value;

    // Update state
    if (e.target.id === 'ratio-old') {
        state.ratioOld = parseFloat(value) || 0;
    } else {
        state.ratioNew = parseFloat(value) || 0;
    }

    updateConclusionRatio();
    validateInputs();
}

function handleCurrencyInput(e) {
    // Remove non-numeric characters
    let value = e.target.value.replace(/\D/g, '');

    // Limit to 6 digits (Price limit)
    if (value.length > 6) {
        value = value.slice(0, 6);
    }

    const numberValue = parseFloat(value) || 0;

    // Update state based on input ID
    if (e.target.id === 'right-price') {
        state.rightPrice = numberValue;
        updateNewAvgPrice();
    } else if (e.target.id === 'current-avg-price') {
        state.currentAvgPrice = numberValue;
        updateCurrentTotalValue();
    } else if (e.target.id === 'cum-date-price') {
        state.cumDatePrice = numberValue;
    }

    // Format display
    if (value) {
        e.target.value = formatCurrency(numberValue, false);
    } else {
        e.target.value = '';
    }

    validateInputs();
}

function handleNumberInput(e) {
    // Remove non-numeric characters
    let value = e.target.value.replace(/\D/g, '');

    // Limit to 13 digits (Shares limit)
    if (value.length > 13) {
        value = value.slice(0, 13);
    }

    const numberValue = parseFloat(value) || 0;

    if (e.target.id === 'current-shares') {
        state.currentShares = numberValue;
        updateCurrentTotalValue();
    }

    if (value) {
        e.target.value = new Intl.NumberFormat('id-ID').format(numberValue);
    } else {
        e.target.value = '';
    }

    validateInputs();
}

// Real-time updates
function updateCurrentTotalValue() {
    const total = state.currentShares * state.currentAvgPrice;
    currentTotalValueDisplay.textContent = formatCurrency(total);
}

function updateNewAvgPrice() {
    newAvgPriceDisplay.textContent = formatCurrency(state.rightPrice);
    conclusionExercisePriceDisplay.textContent = formatCurrency(state.rightPrice);
}

function updateConclusionRatio() {
    if (state.ratioOld && state.ratioNew) {
        conclusionRatioDisplay.textContent = `${state.ratioOld}:${state.ratioNew}`;
    } else {
        conclusionRatioDisplay.textContent = '-';
    }
}

// Validation
function validateInputs() {
    const isValid =
        state.ratioOld > 0 &&
        state.ratioNew > 0 &&
        state.rightPrice > 0 &&
        state.currentShares > 0 &&
        state.currentAvgPrice > 0 &&
        state.cumDatePrice > 0;

    calculateBtn.disabled = !isValid;

    // Hide recommendation when inputs change
    recommendationBox.classList.add('hidden');
    recommendationBox.classList.remove('buy', 'sell');
}

// Calculation
function calculate() {
    // 1. Calculate New Shares (Total Lembar Baru)
    // Formula: (Total Lembar Saham / Ratio_X) * Ratio_Y
    const newShares = (state.currentShares / state.ratioOld) * state.ratioNew;

    // 2. Calculate New Total Value (Total Value Baru)
    // Formula: Total Lembar Baru * Harga Right Issue
    const newTotalValue = newShares * state.rightPrice;

    // 3. Calculate Final Shares (Total Lembar Akhir)
    // Formula: Total Lembar Saham + Total Lembar Baru
    const finalShares = state.currentShares + newShares;

    // 4. Calculate Final Total Value (Total Value Akhir)
    // Formula: Total Value Saat Ini + Total Value Baru
    const currentTotalValue = state.currentShares * state.currentAvgPrice;
    const finalTotalValue = currentTotalValue + newTotalValue;

    // 5. Calculate Final Average Price (Average Harga Akhir)
    // Formula: Total Value Akhir / Total Lembar Akhir
    const finalAvgPrice = finalTotalValue / finalShares;

    // 6. Calculate Theoretical Price
    // Formula: ((Cum Date Price * X) + (Exercise Price * Y)) / (X + Y)
    const theoreticalPrice = (
        (state.cumDatePrice * state.ratioOld) +
        (state.rightPrice * state.ratioNew)
    ) / (state.ratioOld + state.ratioNew);

    // Update UI
    newSharesCountDisplay.textContent = formatNumber(newShares);
    newTotalValueDisplay.textContent = formatCurrency(newTotalValue);

    finalSharesDisplay.textContent = formatNumber(finalShares);
    finalAvgPriceDisplay.textContent = formatCurrency(finalAvgPrice);
    finalTotalValueDisplay.textContent = formatCurrency(finalTotalValue);

    theoreticalPriceDisplay.textContent = formatCurrency(theoreticalPrice);

    // Update Conclusion Section
    conclusionNewSharesDisplay.textContent = formatNumber(newShares);
    conclusionTotalCostDisplay.textContent = formatCurrency(newTotalValue);
    conclusionNewAvgPriceDisplay.textContent = formatCurrency(finalAvgPrice);

    // Recommendation Logic
    // "Average Harga Baru" now refers to the Final Average Price (as per user request)
    const avgHargaBaru = finalAvgPrice;

    recommendationBox.classList.remove('hidden', 'buy', 'sell');

    if (avgHargaBaru < theoreticalPrice) {
        recommendationBox.classList.add('buy');
        recommendationText.textContent = "Harga average baru Anda masih di BAWAH harga teoritis, Anda masih berpeluang untung jika menebus Right Issue";
    } else {
        recommendationBox.classList.add('sell');
        recommendationText.textContent = "Harga average baru Anda sudah di ATAS harga teoritisnya, Anda berpeluang rugi jika tetap menebus Right Issue";
    }
}

// Utilities
function formatCurrency(number, withSymbol = true) {
    return new Intl.NumberFormat('id-ID', {
        style: withSymbol ? 'currency' : 'decimal',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(number);
}

function formatNumber(number) {
    return new Intl.NumberFormat('id-ID', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(number);
}

// Run
init();
