import React, { useState } from 'react';
import { 
  X, 
  Send, 
  Printer, 
  CheckCircle2, 
  ShoppingBag, 
  MapPin, 
  Phone, 
  User, 
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { CartItem, SheetConfig } from '../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  config: SheetConfig;
  onOrderCompleted: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cart,
  config,
  onOrderCompleted,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [address, setAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [orderId] = useState(`ORD-${Math.floor(100000 + Math.random() * 900000)}`);

  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.item.price * item.quantity, 0);
  const isFreeDelivery = subtotal >= 35 || deliveryMethod === 'pickup';
  const deliveryFee = isFreeDelivery ? 0 : 3.99;
  const estimatedTax = subtotal * 0.05;
  const grandTotal = subtotal + deliveryFee + estimatedTax;

  const generateWhatsAppMessage = () => {
    const lines = [
      `🛒 *NEW ORDER: ${orderId}*`,
      `*Store:* ${config.storeName}`,
      `*Customer:* ${customerName || 'Customer'}`,
      `*Phone:* ${phoneNumber || 'N/A'}`,
      `*Method:* ${deliveryMethod === 'delivery' ? `Delivery to: ${address || 'Address provided on call'}` : 'In-Store Pickup'}`,
      orderNotes ? `*Notes:* ${orderNotes}` : '',
      '',
      `*ITEMS:*`,
      ...cart.map(
        (ci) =>
          `• ${ci.quantity}x ${ci.item.name} (${config.currencySymbol}${ci.item.price.toFixed(2)}${ci.item.unit ? ` / ${ci.item.unit}` : ''}) = ${config.currencySymbol}${(ci.item.price * ci.quantity).toFixed(2)}`
      ),
      '',
      `Subtotal: ${config.currencySymbol}${subtotal.toFixed(2)}`,
      `Delivery: ${deliveryFee === 0 ? 'FREE' : `${config.currencySymbol}${deliveryFee.toFixed(2)}`}`,
      `Tax: ${config.currencySymbol}${estimatedTax.toFixed(2)}`,
      `*GRAND TOTAL: ${config.currencySymbol}${grandTotal.toFixed(2)}*`,
    ].filter(Boolean);

    return encodeURIComponent(lines.join('\n'));
  };

  const handleSendWhatsApp = () => {
    const text = generateWhatsAppMessage();
    window.open(`https://wa.me/?text=${text}`, '_blank');
    setIsSubmitted(true);
    onOrderCompleted();
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleConfirmOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    onOrderCompleted();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        
        {/* Backdrop */}
        <div
          onClick={onClose}
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs transition-opacity"
        />

        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-xl">
          
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-emerald-700 text-white">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-200" />
              <h3 className="text-lg font-bold">
                {isSubmitted ? 'Order Confirmed!' : 'Checkout & Order Summary'}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-emerald-800 text-emerald-100 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {isSubmitted ? (
            /* Order Success View */
            <div className="p-6 sm:p-8 text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-xl font-extrabold text-gray-900">
                  Thank You for Your Order!
                </h4>
                <p className="mt-1 text-sm text-gray-500">
                  Order ID: <span className="font-mono font-bold text-gray-800">{orderId}</span>
                </p>
                <p className="mt-2 text-xs text-gray-500 max-w-sm mx-auto">
                  Your fresh supermarket groceries are being prepared. Changes made to the Google Sheet continue to keep inventory up to date!
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-3">
                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer"
                >
                  <span>Continue Shopping</span>
                </button>
              </div>
            </div>
          ) : (
            /* Checkout Form View */
            <form onSubmit={handleConfirmOrder} className="p-4 sm:p-6 space-y-5">
              
              {/* Delivery method toggle */}
              <div className="grid grid-cols-2 gap-3 p-1 rounded-xl bg-gray-100">
                <button
                  type="button"
                  onClick={() => setDeliveryMethod('delivery')}
                  className={`py-2 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer ${
                    deliveryMethod === 'delivery'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Home Delivery
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryMethod('pickup')}
                  className={`py-2 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer ${
                    deliveryMethod === 'pickup'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  In-Store Pickup
                </button>
              </div>

              {/* Customer Info fields */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Phone / WhatsApp Number *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+1 (555) 000-1234"
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
                    />
                  </div>
                </div>

                {deliveryMethod === 'delivery' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Delivery Address *
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Street Address, Apt #, City"
                        className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Special Instructions (Optional)
                  </label>
                  <div className="relative">
                    <MessageSquare className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="e.g. Ripe bananas please, leave at front door"
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Order Items summary box */}
              <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-200 text-xs space-y-2">
                <div className="font-bold text-gray-800 flex justify-between">
                  <span>Order Items ({cart.length})</span>
                  <span>Amount</span>
                </div>
                <div className="max-h-28 overflow-y-auto divide-y divide-gray-100 pr-1">
                  {cart.map(({ item, quantity }) => (
                    <div key={item.id} className="py-1.5 flex justify-between text-gray-600">
                      <span className="truncate max-w-[240px]">
                        {quantity}x {item.name}
                      </span>
                      <span className="font-mono text-gray-900 font-medium">
                        {config.currencySymbol}{(item.price * quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-gray-200 flex justify-between font-bold text-sm text-gray-900">
                  <span>Total Due</span>
                  <span className="text-emerald-700 font-mono">
                    {config.currencySymbol}{grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-sm cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Order via WhatsApp</span>
                </button>

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  <span>Confirm Order Locally</span>
                </button>
              </div>

            </form>
          )}

        </div>
      </div>
    </div>
  );
};
