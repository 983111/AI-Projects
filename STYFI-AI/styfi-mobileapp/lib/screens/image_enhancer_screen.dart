import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../models.dart';
import '../services/api_service.dart';

class ImageEnhancerScreen extends StatefulWidget {
  const ImageEnhancerScreen({super.key});

  @override
  State<ImageEnhancerScreen> createState() => _ImageEnhancerScreenState();
}

class _ImageEnhancerScreenState extends State<ImageEnhancerScreen> {
  File? _image;
  final TextEditingController _descController = TextEditingController();
  bool _loading = false;
  AiResult? _result;

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      setState(() {
        _image = File(pickedFile.path);
        _result = null;
      });
    }
  }

  Future<void> _enhance() async {
    if (_image == null || _descController.text.isEmpty) return;
    setState(() => _loading = true);
    final res = await ApiService.enhanceImage(_image!, _descController.text);
    setState(() {
      _result = res;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          GestureDetector(
            onTap: _pickImage,
            child: Container(
              height: 200,
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.grey.shade300, style: BorderStyle.solid),
              ),
              child: _image != null
                  ? ClipRRect(borderRadius: BorderRadius.circular(16), child: Image.file(_image!, fit: BoxFit.cover))
                  : const Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [Icon(Icons.add_a_photo, size: 50, color: Colors.pink), Text("Upload Raw Photo")],
                    ),
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _descController,
            maxLines: 3,
            decoration: const InputDecoration(
              hintText: "Describe the product (e.g. Handmade ceramic vase...)",
              border: OutlineInputBorder(),
              filled: true,
              fillColor: Colors.white,
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _loading ? null : _enhance,
              style: ElevatedButton.styleFrom(backgroundColor: Colors.pink, foregroundColor: Colors.white, padding: const EdgeInsets.all(16)),
              child: _loading ? const CircularProgressIndicator(color: Colors.white) : const Text("Enhance Photo"),
            ),
          ),
          const SizedBox(height: 24),
          if (_result != null)
             _result!.type == 'image'
                ? Column(children: [
                    const Text("Enhanced Result:", style: TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    ClipRRect(borderRadius: BorderRadius.circular(12), child: Image.memory(base64Decode(_result!.data)))
                  ])
                : Container(
                    padding: const EdgeInsets.all(16),
                    color: Colors.white,
                    child: Text(_result!.data),
                  )
        ],
      ),
    );
  }
}
