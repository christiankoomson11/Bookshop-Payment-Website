document.addEventListener("DOMContentLoaded", function () {

    let cart = [];

    const addToCartButtons = document.querySelectorAll(".add-to-cart");
    const cartItems = document.getElementById("cartItems");
    const cartTotal = document.getElementById("cartTotal");

    addToCartButtons.forEach(function (button) {
        button.addEventListener("click", function () {

            const title = button.getAttribute("data-title");
            const price = Number(button.getAttribute("data-price"));

            cart.push({
                title: title,
                price: price
            });

            updateCart();

            alert(title + " has been added to the cart successfully!");
        });
    });

    function updateCart() {
        if (!cartItems || !cartTotal) {
            return;
        }

        cartItems.innerHTML = "";

        let total = 0;

        cart.forEach(function (item) {
            total += item.price;

            const itemElement = document.createElement("p");
            itemElement.textContent = item.title + " - £" + item.price.toFixed(2);

            cartItems.appendChild(itemElement);
        });

        cartTotal.textContent = total.toFixed(2);

        // Saves total for pay.html
        sessionStorage.setItem("totalPrice", total.toFixed(2));
        sessionStorage.setItem("cart", JSON.stringify(cart));
    }

    const paymentTotal = document.getElementById("paymentTotal");

    if (paymentTotal) {
        const storedTotal = sessionStorage.getItem("totalPrice");

        if (storedTotal) {
            paymentTotal.textContent = storedTotal;
        }
    }

    const paymentForm = document.getElementById("paymentForm");

    if (paymentForm) {
        paymentForm.addEventListener("submit", function (event) {
            event.preventDefault();
            validatePayment();
        });
    }

    const maskedCard = document.getElementById("maskedCard");
    const successMessage = document.getElementById("successMessage");
    const successTotal = document.getElementById("successTotal");

    if (maskedCard) {
        const lastFourDigits = sessionStorage.getItem("lastFourDigits");

        if (lastFourDigits) {
            maskedCard.textContent = "**** **** **** " + lastFourDigits;
        }
    }

    if (successMessage) {
        successMessage.textContent = "Thank you for your payment.";
    }

    if (successTotal) {
        const storedTotal = sessionStorage.getItem("totalPrice");

        if (storedTotal) {
            successTotal.textContent = storedTotal;
        }
    }
});

function validatePayment() {
    const cardNumber = document.getElementById("cardNumber").value.trim();
    const expMonth = document.getElementById("expMonth").value.trim();
    const expYear = document.getElementById("expYear").value.trim();
    const cvv = document.getElementById("cvv").value.trim();
    const errorMessage = document.getElementById("errorMessage");

    errorMessage.textContent = "";

    const cardRegex = /^(51|52|53|54|55)[0-9]{14}$/;
    const cvvRegex = /^[0-9]{3,4}$/;

    if (!cardRegex.test(cardNumber)) {
        errorMessage.textContent = "Please enter a valid 16-digit Mastercard number starting with 51, 52, 53, 54, or 55.";
        return;
    }

    if (expMonth === "" || Number(expMonth) < 1 || Number(expMonth) > 12) {
        errorMessage.textContent = "Please enter a valid expiry month.";
        return;
    }

    if (expYear === "") {
        errorMessage.textContent = "Please enter a valid expiry year.";
        return;
    }

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    if (
        Number(expYear) < currentYear ||
        (Number(expYear) === currentYear && Number(expMonth) < currentMonth)
    ) {
        errorMessage.textContent = "This card has expired.";
        return;
    }

    if (!cvvRegex.test(cvv)) {
        errorMessage.textContent = "Please enter a valid 3 or 4 digit security code.";
        return;
    }

    sendPayment(cardNumber, expMonth, expYear, cvv);
}

function sendPayment(cardNumber, expMonth, expYear, cvv) {
    const errorMessage = document.getElementById("errorMessage");

    const paymentData = {
        master_card: Number(cardNumber),
        exp_year: Number(expYear),
        exp_month: Number(expMonth),
        cvv_code: cvv
    };

    fetch("https://mudfoot.doc.stu.mmu.ac.uk/node/api/creditcard", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(paymentData)
    })
    .then(function (response) {
        if (!response.ok) {
            throw new Error("Payment failed. Please check your card details and try again.");
        }

        return response.json();
    })

    .then(function (data) {
    sessionStorage.setItem("lastFourDigits", cardNumber.slice(-4));
    sessionStorage.setItem("successMessage", data.message);

    const paymentTotal = document.getElementById("paymentTotal").textContent;
    sessionStorage.setItem("totalPrice", paymentTotal);

    window.location.href = "success.html";
    })
    
    .catch(function (error) {
        errorMessage.textContent = error.message;
    });
}