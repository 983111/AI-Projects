// lib/screens/outfit_composer_screen.dart
import 'package:flutter/material.dart';
import '../mock_data.dart';
import '../models.dart';
import '../services/api_service.dart';
import 'marketplace_screen.dart'; // FIX: This import allows access to ProductCard

class OutfitComposerScreen extends StatefulWidget {
  const OutfitComposerScreen({super.key});

  @override
  State<OutfitComposerScreen> createState() => _OutfitComposerScreenState();
}

class _OutfitComposerScreenState extends State<OutfitComposerScreen> {
  Product? selectedProduct;
  List<OutfitSuggestion> suggestions = [];
  bool isLoading = false;

  Future<void> _generateOutfit(Product product) async {
    setState(() {
      selectedProduct = product;
      isLoading = true;
      suggestions = [];
    });

    final results = await ApiService.composeOutfit(product.name, product.category);

    setState(() {
      suggestions = results;
      isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Row(
        children: [
          // Product Selector
          Expanded(
            flex: 2,
            child: ListView.builder(
              padding: const EdgeInsets.all(8),
              itemCount: mockProducts.length,
              itemBuilder: (context, index) {
                final p = mockProducts[index];
                return GestureDetector(
                  onTap: () => _generateOutfit(p),
                  child: Container(
                    height: 100,
                    margin: const EdgeInsets.only(bottom: 8),
                    decoration: BoxDecoration(
                      border: selectedProduct?.id == p.id ? Border.all(color: Colors.pink, width: 2) : null,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                         SizedBox(width: 80, child: ProductCard(product: p)), // Now correctly found
                         const SizedBox(width: 10),
                         Expanded(child: Text(p.name, style: const TextStyle(fontWeight: FontWeight.bold))),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          // Results Area
          Expanded(
            flex: 3,
            child: Container(
              color: Colors.white,
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text("AI Recommendations", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  if (isLoading)
                    const Center(child: Padding(padding: EdgeInsets.all(20), child: CircularProgressIndicator()))
                  else if (suggestions.isNotEmpty)
                    Expanded(
                      child: ListView.builder(
                        itemCount: suggestions.length,
                        itemBuilder: (context, index) {
                          final s = suggestions[index];
                          return ListTile(
                            leading: CircleAvatar(backgroundColor: Colors.pink[100], child: const Icon(Icons.check, color: Colors.pink)),
                            title: Text(s.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                            subtitle: Text("${s.reason}\n${s.estimatedPrice} • ${s.color}"),
                            isThreeLine: true,
                          );
                        },
                      ),
                    )
                  else
                    const Center(child: Text("Select a product to see outfit ideas")),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}