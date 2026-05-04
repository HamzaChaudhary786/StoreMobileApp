import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Modal } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Calculator, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const BUTTON_SIZE = 60;

export function FloatingCalculator() {
  const [isOpen, setIsOpen] = useState(false);
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  
  const insets = useSafeAreaInsets();
  const isDragging = useSharedValue(false);
  const translateX = useSharedValue(width - BUTTON_SIZE - 20); // Initial position bottom right
  const translateY = useSharedValue(height - insets.bottom - BUTTON_SIZE - 100);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      isDragging.value = true;
    })
    .onUpdate((event) => {
      translateX.value = event.absoluteX - BUTTON_SIZE / 2;
      translateY.value = event.absoluteY - BUTTON_SIZE / 2;
    })
    .onEnd((event) => {
      isDragging.value = false;
      // Snap to edges or stay within bounds
      let targetX = event.absoluteX - BUTTON_SIZE / 2;
      let targetY = event.absoluteY - BUTTON_SIZE / 2;

      // X bounds
      if (targetX < 20) targetX = 20;
      if (targetX > width - BUTTON_SIZE - 20) targetX = width - BUTTON_SIZE - 20;
      
      // Y bounds
      if (targetY < insets.top + 20) targetY = insets.top + 20;
      if (targetY > height - insets.bottom - BUTTON_SIZE - 20) targetY = height - insets.bottom - BUTTON_SIZE - 20;

      translateX.value = withSpring(targetX, { damping: 15 });
      translateY.value = withSpring(targetY, { damping: 15 });
    })
    .runOnJS(true); // Required for some older gesture handler setups, but safe to include

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
    };
  });

  const handleNumber = (num: string) => {
    setDisplay((prev) => (prev === '0' ? num : prev + num));
  };

  const handleOperator = (op: string) => {
    setEquation(display + ' ' + op + ' ');
    setDisplay('0');
  };

  const handleEqual = () => {
    try {
      const fullEquation = equation + display;
      const cleanEq = fullEquation.replace(/×/g, '*').replace(/÷/g, '/');
      // eslint-disable-next-line no-eval
      const result = eval(cleanEq);
      setDisplay(String(result));
      setEquation('');
    } catch (e) {
      setDisplay('Error');
      setEquation('');
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
  };

  const handleDelete = () => {
    setDisplay((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
  };

  // The floating button
  return (
    <>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.floatingButtonContainer, animatedStyle]}>
          <TouchableOpacity 
            style={styles.floatingButton} 
            onPress={() => setIsOpen(true)}
            activeOpacity={0.8}
          >
            <Calculator size={28} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      </GestureDetector>

      {/* Calculator Modal */}
      <Modal visible={isOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.calculatorContainer}>
            <View style={styles.header}>
              <View style={styles.headerTitle}>
                <Calculator size={18} color="#666" />
                <Text style={styles.headerText}>Calculator</Text>
              </View>
              <TouchableOpacity onPress={() => setIsOpen(false)} style={styles.closeBtn}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.displayContainer}>
              <Text style={styles.equationText} numberOfLines={1}>{equation}</Text>
              <Text style={styles.displayText} numberOfLines={1}>{display}</Text>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.calcBtn, styles.btnRed]} onPress={handleClear}>
                <Text style={styles.btnTextRed}>AC</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.calcBtn, styles.btnGray]} onPress={handleDelete}>
                <Text style={styles.btnTextDark}>DEL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.calcBtn, styles.btnBlue]} onPress={() => handleOperator('/')}>
                <Text style={styles.btnTextBlue}>÷</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.calcBtn, styles.btnLight]} onPress={() => handleNumber('7')}>
                <Text style={styles.btnTextDark}>7</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.calcBtn, styles.btnLight]} onPress={() => handleNumber('8')}>
                <Text style={styles.btnTextDark}>8</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.calcBtn, styles.btnLight]} onPress={() => handleNumber('9')}>
                <Text style={styles.btnTextDark}>9</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.calcBtn, styles.btnBlue]} onPress={() => handleOperator('*')}>
                <Text style={styles.btnTextBlue}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.calcBtn, styles.btnLight]} onPress={() => handleNumber('4')}>
                <Text style={styles.btnTextDark}>4</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.calcBtn, styles.btnLight]} onPress={() => handleNumber('5')}>
                <Text style={styles.btnTextDark}>5</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.calcBtn, styles.btnLight]} onPress={() => handleNumber('6')}>
                <Text style={styles.btnTextDark}>6</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.calcBtn, styles.btnBlue]} onPress={() => handleOperator('-')}>
                <Text style={styles.btnTextBlue}>-</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.calcBtn, styles.btnLight]} onPress={() => handleNumber('1')}>
                <Text style={styles.btnTextDark}>1</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.calcBtn, styles.btnLight]} onPress={() => handleNumber('2')}>
                <Text style={styles.btnTextDark}>2</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.calcBtn, styles.btnLight]} onPress={() => handleNumber('3')}>
                <Text style={styles.btnTextDark}>3</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.calcBtn, styles.btnBlue]} onPress={() => handleOperator('+')}>
                <Text style={styles.btnTextBlue}>+</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.calcBtn, styles.btnLight, { flex: 2 }]} onPress={() => handleNumber('0')}>
                <Text style={styles.btnTextDark}>0</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.calcBtn, styles.btnLight]} onPress={() => handleNumber('.')}>
                <Text style={styles.btnTextDark}>.</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.calcBtn, styles.btnPrimary]} onPress={handleEqual}>
                <Text style={styles.btnTextLight}>=</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingButtonContainer: {
    position: 'absolute',
    zIndex: 9999,
  },
  floatingButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: '#0ea5e9', // primary color
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calculatorContainer: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginLeft: 8,
  },
  closeBtn: {
    padding: 4,
  },
  displayContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  equationText: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 4,
    height: 20,
  },
  displayText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  calcBtn: {
    flex: 1,
    aspectRatio: 1, // square buttons
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  btnLight: {
    backgroundColor: '#f1f5f9',
  },
  btnGray: {
    backgroundColor: '#e2e8f0',
  },
  btnRed: {
    flex: 2,
    aspectRatio: undefined, // remove aspect ratio to allow flex: 2 width
    backgroundColor: '#fee2e2',
  },
  btnBlue: {
    backgroundColor: '#e0f2fe',
  },
  btnPrimary: {
    backgroundColor: '#0ea5e9',
  },
  btnTextDark: {
    fontSize: 24,
    fontWeight: '600',
    color: '#334155',
  },
  btnTextLight: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
  },
  btnTextRed: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ef4444',
  },
  btnTextBlue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#0ea5e9',
  },
});
