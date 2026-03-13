// lib/screens/marketplace_screen.dart
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../models.dart';
import '../services/database_service.dart';
<<<<<<< HEAD
import 'checkout_screen.dart'; // Import Checkout
=======
>>>>>>> 9b3456e6285ce023c13c7915bd9d5a11a4f51582

class MarketplaceScreen extends StatelessWidget {
  const MarketplaceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<List<Product>>(
      stream: DatabaseService().getProducts(),
      builder: (context, snapshot) {
<<<<<<< HEAD
        if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
        
        final products = snapshot.data!;

        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const Text("Latest Drops", style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 0.7,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
              ),
              itemCount: products.length,
              itemBuilder: (context, index) {
                return GestureDetector(
                  onTap: () => _showProductDetails(context, products[index]),
                  child: ProductCard(product: products[index]),
                );
              },
            ),
          ],
        );
      },
    );
  }

  void _showProductDetails(BuildContext context, Product product) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        height: MediaQuery.of(context).size.height * 0.7,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: CachedNetworkImage(
                  imageUrl: product.image,
                  height: 250,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  errorWidget: (_,__,___) => Container(height: 250, color: Colors.grey[200], child: const Icon(Icons.broken_image)),
                ),
              ),
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(child: Text(product.name, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold))),
                Text("\$${product.price}", style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFFE11D48))),
              ],
            ),
            const SizedBox(height: 8),
            Chip(label: Text(product.category)),
            const SizedBox(height: 16),
            Text(product.description, style: TextStyle(color: Colors.grey[600])),
            const Spacer(),
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: () {
                  // Navigate to Checkout Screen instead of instant buy
                  Navigator.pop(context); // Close bottom sheet
                  Navigator.push(
                    context, 
                    MaterialPageRoute(builder: (_) => CheckoutScreen(product: product))
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFE11D48),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: const Text("Buy Now", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              ),
            )
          ],
        ),
      ),
=======
        // Fallback for loading/error or empty states
        if (snapshot.hasError) return const Center(child: Text("Error loading products"));
        if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());

        final products = snapshot.data!;

        if (products.isEmpty) {
          return const Center(child: Text("No products found"));
        }

        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Hero Section
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                image: const DecorationImage(
                  image: CachedNetworkImageProvider('https://images.unsplash.com/photo-1483985988355-763728e1935b'),
                  fit: BoxFit.cover,
                  opacity: 0.2,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text("Curated style,\npowered by AI", 
                    style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.grey[900])),
                  const SizedBox(height: 10),
                  const Text("Connect with small businesses and use AI to upgrade your wardrobe.",
                    style: TextStyle(fontSize: 16, color: Colors.black87)),
                ],
              ),
            ),
            const SizedBox(height: 24),
            const Text("Featured Collections", 
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 0.7,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
              ),
              itemCount: products.length,
              itemBuilder: (context, index) {
                return ProductCard(product: products[index]);
              },
            ),
          ],
        );
      },
>>>>>>> 9b3456e6285ce023c13c7915bd9d5a11a4f51582
    );
  }
}

// FIX: Added the missing ProductCard class
class ProductCard extends StatelessWidget {
  final Product product;
  const ProductCard({super.key, required this.product});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(color: Colors.grey.withOpacity(0.1), blurRadius: 4, spreadRadius: 1)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
              child: CachedNetworkImage(
                imageUrl: product.image, 
                fit: BoxFit.cover, 
                width: double.infinity,
                placeholder: (context, url) => Container(color: Colors.grey[200]),
                errorWidget: (context, url, error) => const Icon(Icons.error),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(12.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(product.category.toUpperCase(), style: const TextStyle(fontSize: 10, color: Colors.pink, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text(product.name, maxLines: 1, overflow: TextOverflow.ellipsis, 
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 4),
                Text("\$${product.price}", style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}