import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../models.dart';
import '../mock_data.dart';
import '../services/api_service.dart';

class VirtualTryOnScreen extends StatefulWidget {
  const VirtualTryOnScreen({super.key});

  @override
  State<VirtualTryOnScreen> createState() => _VirtualTryOnScreenState();
}

class _VirtualTryOnScreenState extends State<VirtualTryOnScreen> {
  Product? selectedProduct;
  File? userImage;
  AiResult? result;
  bool isLoading = false;
  final ImagePicker _picker = ImagePicker();

  Future<void> _pickImage() async {
    final XFile? image = await _picker.pickImage(source: ImageSource.gallery);
    if (image != null) {
      setState(() {
        userImage = File(image.path);
        result = null;
      });
    }
  }

  Future<void> _generateTryOn() async {
    if (userImage == null || selectedProduct == null) return;
    setState(() => isLoading = true);
    final res = await ApiService.virtualTryOn(userImage!, selectedProduct!.image);
    setState(() {
      result = res;
      isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text("1. Select Product", style: TextStyle(fontWeight: FontWeight.bold)),
          SizedBox(
            height: 120,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: mockProducts.length,
              itemBuilder: (context, index) {
                final p = mockProducts[index];
                return GestureDetector(
                  onTap: () => setState(() => selectedProduct = p),
                  child: Container(
                    width: 100,
                    margin: const EdgeInsets.only(right: 8, top: 8),
                    decoration: BoxDecoration(
                      border: selectedProduct?.id == p.id ? Border.all(color: Colors.pink, width: 3) : null,
                      borderRadius: BorderRadius.circular(8),
                      image: DecorationImage(image: NetworkImage(p.image), fit: BoxFit.cover),
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 20),
          const Text("2. Upload Your Photo", style: TextStyle(fontWeight: FontWeight.bold)),
          GestureDetector(
            onTap: _pickImage,
            child: Container(
              height: 200,
              margin: const EdgeInsets.only(top: 8),
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border.all(color: Colors.grey.shade300, style: BorderStyle.solid),
                borderRadius: BorderRadius.circular(12),
              ),
              child: userImage != null
                  ? Image.file(userImage!, fit: BoxFit.contain)
                  : const Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [Icon(Icons.upload_file, size: 40, color: Colors.pink), Text("Tap to upload")],
                    ),
            ),
          ),
          const SizedBox(height: 20),
          ElevatedButton.icon(
            onPressed: (isLoading || userImage == null || selectedProduct == null) ? null : _generateTryOn,
            icon: isLoading ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.check),
            label: Text(isLoading ? "Processing..." : "Try On Now"),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.pink,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.all(16),
            ),
          ),
          const SizedBox(height: 20),
          if (result != null) ...[
            const Text("Result", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
              child: result!.type == 'image'
                  ? Image.memory(base64Decode(result!.data), fit: BoxFit.contain)
                  : Text(result!.data, style: const TextStyle(fontSize: 16)),
            )
          ]
        ],
      ),
    );
  }
}
