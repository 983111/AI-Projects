import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../models.dart';
import '../services/database_service.dart';

class CheckoutScreen extends StatefulWidget {
  final Product product;
  const CheckoutScreen({super.key, required this.product});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final _formKey = GlobalKey<FormState>();
  
  // Address Controllers
  final _nameCtrl = TextEditingController();
  final _streetCtrl = TextEditingController();
  final _cityCtrl = TextEditingController();
  final _zipCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();

  String _paymentMethod = "Credit/Debit Card";
  bool _isLoading = false;

  void _placeOrder() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() => _isLoading = true);

    final user = FirebaseAuth.instance.currentUser;
    if (user != null) {
      final address = Address(
        fullName: _nameCtrl.text,
        street: _streetCtrl.text,
        city: _cityCtrl.text,
        zip: _zipCtrl.text,
        phone: _phoneCtrl.text,
      );

      await DatabaseService().placeFullOrder(
        user.uid,
        widget.product,
        address,
        _paymentMethod
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Order Placed Successfully!"), backgroundColor: Colors.green)
        );
        // Go back to marketplace
        Navigator.popUntil(context, (route) => route.isFirst);
      }
    }
    setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Checkout")),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. Product Summary
              const Text("Review Item", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              Card(
                margin: const EdgeInsets.symmetric(vertical: 10),
                child: ListTile(
                  leading: Image.network(widget.product.image, width: 50, fit: BoxFit.cover, 
                    errorBuilder: (c,e,s) => const Icon(Icons.image)),
                  title: Text(widget.product.name),
                  subtitle: Text("Qty: 1"),
                  trailing: Text("\$${widget.product.price}", style: const TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
              const Divider(height: 30),

              // 2. Shipping Address
              const Text("Shipping Address", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 10),
              TextFormField(controller: _nameCtrl, decoration: _inputDec("Full Name"), validator: (v) => v!.isEmpty ? "Required" : null),
              const SizedBox(height: 10),
              TextFormField(controller: _streetCtrl, decoration: _inputDec("Street Address"), validator: (v) => v!.isEmpty ? "Required" : null),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(child: TextFormField(controller: _cityCtrl, decoration: _inputDec("City"), validator: (v) => v!.isEmpty ? "Required" : null)),
                  const SizedBox(width: 10),
                  Expanded(child: TextFormField(controller: _zipCtrl, decoration: _inputDec("ZIP Code"), validator: (v) => v!.isEmpty ? "Required" : null)),
                ],
              ),
              const SizedBox(height: 10),
              TextFormField(controller: _phoneCtrl, decoration: _inputDec("Phone Number"), keyboardType: TextInputType.phone, validator: (v) => v!.isEmpty ? "Required" : null),
              
              const Divider(height: 30),

              // 3. Payment Method
              const Text("Payment Method", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              RadioListTile(
                value: "Credit/Debit Card", groupValue: _paymentMethod, 
                onChanged: (v) => setState(() => _paymentMethod = v.toString()),
                title: const Text("Credit / Debit Card"), secondary: const Icon(Icons.credit_card),
              ),
              RadioListTile(
                value: "UPI", groupValue: _paymentMethod, 
                onChanged: (v) => setState(() => _paymentMethod = v.toString()),
                title: const Text("UPI / Netbanking"), secondary: const Icon(Icons.qr_code),
              ),
              RadioListTile(
                value: "Cash on Delivery", groupValue: _paymentMethod, 
                onChanged: (v) => setState(() => _paymentMethod = v.toString()),
                title: const Text("Cash on Delivery"), secondary: const Icon(Icons.money),
              ),

              const SizedBox(height: 30),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _placeOrder,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFE11D48),
                    foregroundColor: Colors.white,
                  ),
                  child: _isLoading ? const CircularProgressIndicator(color: Colors.white) : Text("Place Order - \$${widget.product.price}"),
                ),
              )
            ],
          ),
        ),
      ),
    );
  }

  InputDecoration _inputDec(String label) {
    return InputDecoration(
      labelText: label,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
    );
  }
}