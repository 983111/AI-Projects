// lib/screens/profile_screen.dart
import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../models.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final authService = AuthService();
    // This will now work because we added 'currentRole' getter to AuthService
    final isBuyer = authService.currentRole == UserRole.buyer;

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            children: [
              const SizedBox(height: 20),
              // Profile Header
              CircleAvatar(
                radius: 50,
                backgroundColor: isBuyer ? const Color(0xFFE11D48) : Colors.black87,
                child: const Icon(Icons.person, size: 50, color: Colors.white),
              ),
              const SizedBox(height: 16),
              const Text(
                "User Account",
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
              ),
              Text(
                isBuyer ? "Buyer Account" : "Seller Account",
                style: const TextStyle(color: Colors.grey, fontSize: 16),
              ),
              const SizedBox(height: 40),

              // The Mode Switch Card
              Card(
                elevation: 4,
                shadowColor: Colors.black12,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                child: InkWell(
                  onTap: () {
                    if (isBuyer) {
                      authService.switchToSeller();
                    } else {
                      authService.switchToBuyer();
                    }
                  },
                  borderRadius: BorderRadius.circular(16),
                  child: Padding(
                    padding: const EdgeInsets.all(20.0),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: isBuyer ? Colors.black87 : const Color(0xFFE11D48),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Icon(
                            isBuyer ? Icons.store : Icons.shopping_bag,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                isBuyer ? "Switch to Seller Mode" : "Switch to Buyer Mode",
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                isBuyer
                                    ? "Manage products & view earnings"
                                    : "Browse marketplace & shop",
                                style: TextStyle(color: Colors.grey[600], fontSize: 12),
                              ),
                            ],
                          ),
                        ),
                        const Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey),
                      ],
                    ),
                  ),
                ),
              ),
              
              const SizedBox(height: 30),
              
              ListTile(
                leading: const Icon(Icons.logout, color: Colors.red),
                title: const Text("Log Out", style: TextStyle(color: Colors.red, fontWeight: FontWeight.w500)),
                trailing: const Icon(Icons.chevron_right, color: Colors.grey),
                onTap: () => authService.signOut(),
              ),
            ],
          ),
        ),
      ),
    );
  }
<<<<<<< HEAD
}
=======
}
>>>>>>> 9b3456e6285ce023c13c7915bd9d5a11a4f51582
