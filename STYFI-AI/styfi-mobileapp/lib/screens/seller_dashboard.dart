<<<<<<< HEAD
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:image_picker/image_picker.dart';
import '../services/database_service.dart';
import '../models.dart';
=======
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
>>>>>>> 9b3456e6285ce023c13c7915bd9d5a11a4f51582
import 'profile_screen.dart';

class SellerDashboardScreen extends StatefulWidget {
  const SellerDashboardScreen({super.key});

  @override
  State<SellerDashboardScreen> createState() => _SellerDashboardScreenState();
}

class _SellerDashboardScreenState extends State<SellerDashboardScreen> {
  int _currentIndex = 0;
<<<<<<< HEAD
  final List<Widget> _screens = [
    const SellerProductsScreen(), // Actual Products Screen
    const SellerOrdersScreen(),   // Actual Orders Screen
    const ProfileScreen(),
=======

  // Placeholder screens for the Seller Panel
  final List<Widget> _screens = [
    const _SellerHomePlaceholder(),
    const Center(child: Text("Product Management")),
    const Center(child: Text("Order Management")),
    const ProfileScreen(), // Reusing the profile screen for the switch
>>>>>>> 9b3456e6285ce023c13c7915bd9d5a11a4f51582
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
<<<<<<< HEAD
        title: Text('Seller Central', style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.white)),
        backgroundColor: Colors.black87,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: IndexedStack(index: _currentIndex, children: _screens),
=======
        title: Text(
          'Seller Central',
          style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.white),
        ),
        backgroundColor: Colors.black87, // Distinct dark theme for sellers
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
>>>>>>> 9b3456e6285ce023c13c7915bd9d5a11a4f51582
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (index) => setState(() => _currentIndex = index),
        backgroundColor: Colors.white,
<<<<<<< HEAD
        destinations: const [
=======
        indicatorColor: Colors.grey.shade300,
        destinations: const [
          NavigationDestination(icon: Icon(Icons.dashboard_outlined), label: 'Dashboard'),
>>>>>>> 9b3456e6285ce023c13c7915bd9d5a11a4f51582
          NavigationDestination(icon: Icon(Icons.inventory_2_outlined), label: 'Products'),
          NavigationDestination(icon: Icon(Icons.local_shipping_outlined), label: 'Orders'),
          NavigationDestination(icon: Icon(Icons.person_outline), label: 'Profile'),
        ],
      ),
    );
  }
}

<<<<<<< HEAD
// --- PRODUCT UPLOAD & LIST SCREEN ---
class SellerProductsScreen extends StatefulWidget {
  const SellerProductsScreen({super.key});
  @override
  State<SellerProductsScreen> createState() => _SellerProductsScreenState();
}

class _SellerProductsScreenState extends State<SellerProductsScreen> {
  void _showAddProductDialog(String uid) {
    showDialog(context: context, builder: (context) => AddProductDialog(uid: uid));
  }

  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return const SizedBox();

    return Scaffold(
      backgroundColor: Colors.grey[50],
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAddProductDialog(user.uid),
        label: const Text("Add Product"),
        icon: const Icon(Icons.add),
        backgroundColor: Colors.black87,
        foregroundColor: Colors.white,
      ),
      body: StreamBuilder<List<Product>>(
        stream: DatabaseService().getSellerProducts(user.uid),
        builder: (context, snapshot) {
          if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
          final products = snapshot.data!;
          if (products.isEmpty) return const Center(child: Text("No products yet"));

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: products.length,
            itemBuilder: (context, index) {
              final p = products[index];
              return Card(
                child: ListTile(
                  leading: Image.network(p.image, width: 50, height: 50, fit: BoxFit.cover, 
                    errorBuilder: (c,e,s) => const Icon(Icons.image_not_supported)),
                  title: Text(p.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: Text("\$${p.price}"),
                  trailing: IconButton(
                    icon: const Icon(Icons.delete, color: Colors.red),
                    onPressed: () => DatabaseService().deleteProduct(p.id),
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

// --- DIALOG TO PICK IMAGE AND UPLOAD ---
class AddProductDialog extends StatefulWidget {
  final String uid;
  const AddProductDialog({super.key, required this.uid});

  @override
  State<AddProductDialog> createState() => _AddProductDialogState();
}

class _AddProductDialogState extends State<AddProductDialog> {
  final _nameCtrl = TextEditingController();
  final _priceCtrl = TextEditingController();
  final _catCtrl = TextEditingController();
  File? _imageFile;
  bool _uploading = false;

  Future<void> _pickImage() async {
    final picked = await ImagePicker().pickImage(source: ImageSource.gallery);
    if (picked != null) setState(() => _imageFile = File(picked.path));
  }

  Future<void> _submit() async {
    if (_nameCtrl.text.isEmpty || _priceCtrl.text.isEmpty || _imageFile == null) return;
    
    setState(() => _uploading = true);
    try {
      // 1. UPLOAD IMAGE
      final imageUrl = await DatabaseService().uploadProductImage(_imageFile!, widget.uid);
      
      // 2. SAVE DATA
      final newProduct = Product(
        id: '',
        name: _nameCtrl.text,
        price: double.tryParse(_priceCtrl.text) ?? 0.0,
        category: _catCtrl.text.isEmpty ? 'General' : _catCtrl.text,
        image: imageUrl,
        description: 'Seller Upload',
        sellerId: widget.uid,
      );
      await DatabaseService().addProduct(newProduct);
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Error: $e")));
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text("List New Item"),
      content: SingleChildScrollView(
        child: Column(
          children: [
            GestureDetector(
              onTap: _pickImage,
              child: Container(
                height: 150, width: double.infinity,
                color: Colors.grey[200],
                child: _imageFile != null 
                  ? Image.file(_imageFile!, fit: BoxFit.cover) 
                  : const Column(mainAxisAlignment: MainAxisAlignment.center, children: [Icon(Icons.add_a_photo, size: 40), Text("Tap to upload")]),
              ),
            ),
            const SizedBox(height: 10),
            TextField(controller: _nameCtrl, decoration: const InputDecoration(labelText: "Name")),
            TextField(controller: _priceCtrl, decoration: const InputDecoration(labelText: "Price"), keyboardType: TextInputType.number),
            TextField(controller: _catCtrl, decoration: const InputDecoration(labelText: "Category")),
          ],
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text("Cancel")),
        ElevatedButton(onPressed: _uploading ? null : _submit, child: _uploading ? const CircularProgressIndicator() : const Text("Upload")),
      ],
    );
  }
}

// --- PLACEHOLDER ORDERS SCREEN ---
class SellerOrdersScreen extends StatelessWidget {
  const SellerOrdersScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return const Center(child: Text("Orders will appear here"));
  }
}
=======
class _SellerHomePlaceholder extends StatelessWidget {
  const _SellerHomePlaceholder();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text("Overview", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
        const SizedBox(height: 16),
        Row(
          children: [
            _buildStatCard("Earnings", "\$1,250", Colors.green),
            const SizedBox(width: 16),
            _buildStatCard("Orders", "12", Colors.blue),
          ],
        ),
        const SizedBox(height: 24),
        Container(
          height: 150,
          decoration: BoxDecoration(
            color: Colors.grey[100],
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey.shade300),
          ),
          child: const Center(child: Text("Sales Chart Placeholder")),
        ),
      ],
    );
  }

  Widget _buildStatCard(String title, String value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(color: Colors.grey.withOpacity(0.1), blurRadius: 10, offset: const Offset(0, 4))
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: TextStyle(color: Colors.grey[600])),
            const SizedBox(height: 8),
            Text(value, style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: color)),
          ],
        ),
      ),
    );
  }
}
>>>>>>> 9b3456e6285ce023c13c7915bd9d5a11a4f51582
