# Script to fix payment_status field
# This is NOT a Django migration
# To run: python manage.py shell
# Then: exec(open('orders/fix_payment_status_script.py').read())

from orders.models import Order

def fix_payment_status():
    # Update all orders without payment_status
    orders_without_payment_status = Order.objects.filter(payment_status__isnull=True)
    if orders_without_payment_status.exists():
        print(f"Updating {orders_without_payment_status.count()} orders without payment_status...")
        orders_without_payment_status.update(payment_status='pending')
        print("Done!")

    # Update orders with empty payment_status
    orders_with_empty_payment_status = Order.objects.filter(payment_status='')
    if orders_with_empty_payment_status.exists():
        print(f"Updating {orders_with_empty_payment_status.count()} orders with empty payment_status...")
        orders_with_empty_payment_status.update(payment_status='pending')
        print("Done!")

    print("All orders have valid payment_status values.")

if __name__ == '__main__':
    fix_payment_status()
