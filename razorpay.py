import razorpay

client = razorpay.Client(auth=("API_KEY", "API_SECRET"))

def create_order(student_id, amount):
    order = client.order.create({
        "amount": amount * 100,  # Amount in paise
        "currency": "INR",
        "payment_capture": 1
    })
    return order
