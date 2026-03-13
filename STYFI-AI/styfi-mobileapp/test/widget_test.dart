<<<<<<< HEAD
=======
// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

>>>>>>> 9b3456e6285ce023c13c7915bd9d5a11a4f51582
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:styfi/main.dart';

void main() {
<<<<<<< HEAD
  testWidgets('App initialization smoke test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const StyfiApp());

    // Verify that the app starts. 
    // We look for a widget likely to be on the login screen.
    // If your app starts with a different screen, this test might need adjustment,
    // but at least it will compile and run the app structure correctly.
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
=======
  testWidgets('Counter increments smoke test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const MyApp());

    // Verify that our counter starts at 0.
    expect(find.text('0'), findsOneWidget);
    expect(find.text('1'), findsNothing);

    // Tap the '+' icon and trigger a frame.
    await tester.tap(find.byIcon(Icons.add));
    await tester.pump();

    // Verify that our counter has incremented.
    expect(find.text('0'), findsNothing);
    expect(find.text('1'), findsOneWidget);
  });
}
>>>>>>> 9b3456e6285ce023c13c7915bd9d5a11a4f51582
