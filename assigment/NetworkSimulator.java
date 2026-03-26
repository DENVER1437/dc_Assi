import java.util.*;

class NetworkSimulator {

    static Scanner sc = new Scanner(System.in);
    static String message;
    static List<String> segments = new ArrayList<>();
    static Random rand = new Random();

    // Application Layer
    static void applicationLayer() {
        System.out.println("\n--- APPLICATION LAYER ---");
        System.out.println("Original Message: " + message);
    }

    // Transport Layer (Segmentation)
    static void transportLayer() {

        System.out.println("\n--- TRANSPORT LAYER (Segmentation) ---");

        segments.clear();

        for (int i = 0; i < message.length(); i += 3) {

            int end = Math.min(i + 3, message.length());
            String part = message.substring(i, end);
            segments.add(part);
        }

        for (int i = 0; i < segments.size(); i++) {
            System.out.println("Segment " + (i + 1) + ": " + segments.get(i));
        }
    }

    // Network Layer (Packet Creation)
    static void networkLayer() {

        System.out.println("\n--- NETWORK LAYER (Packet Creation) ---");

        for (int i = 0; i < segments.size(); i++) {

            System.out.println("\nPacket " + (i + 1));
            System.out.println("Source: A");
            System.out.println("Destination: B");
            System.out.println("Data: " + segments.get(i));
        }
    }

    // Data Link Layer (Frame Creation + CRC)
    static void dataLinkLayer() {

        System.out.println("\n--- DATA LINK LAYER (Frame Creation) ---");

        for (int i = 0; i < segments.size(); i++) {

            String data = segments.get(i);

            int crc = data.length() % 2;

            System.out.println("\nFrame " + (i + 1));
            System.out.println("[Header] 101010");
            System.out.println("[Data] " + data);
            System.out.println("[CRC] " + crc);
        }
    }

    // Physical Layer (Binary Conversion)
    static void physicalLayer() {

        System.out.println("\n--- PHYSICAL LAYER (Binary Conversion) ---");

        for (char c : message.toCharArray()) {

            String binary = String.format("%8s", Integer.toBinaryString(c)).replace(' ', '0');
            System.out.print(binary + " ");
        }

        System.out.println();
    }

    // Transmission with Packet Loss + Delay + Error
    static void transmission() {

        System.out.println("\n--- NETWORK TRANSMISSION ---");

        for (int i = 0; i < segments.size(); i++) {

            System.out.println("\nSending Packet " + (i + 1));

            try { Thread.sleep(1000); } catch (Exception e) {}

            System.out.println("Node A → Router 1");

            try { Thread.sleep(1000); } catch (Exception e) {}

            // Packet Loss Simulation
            if (rand.nextInt(10) < 2) {

                System.out.println("Packet LOST at Router 1 !");
                System.out.println("Retransmitting Packet...");

                try { Thread.sleep(1500); } catch (Exception e) {}

                System.out.println("Packet resent successfully.");
            }

            System.out.println("Router 1 → Router 2");

            try { Thread.sleep(1000); } catch (Exception e) {}

            // Error Simulation
            if (rand.nextInt(10) < 3) {

                System.out.println("ERROR: Packet corrupted during transmission!");
                System.out.println("CRC Check FAILED");
                System.out.println("Retransmitting packet...");

                try { Thread.sleep(1500); } catch (Exception e) {}

                System.out.println("Packet retransmitted successfully.");
            }

            System.out.println("Router 2 → Node B");

            try { Thread.sleep(1000); } catch (Exception e) {}

            System.out.println("Packet Delivered Successfully");
        }
    }

    // Receiver Reconstruction
    static void receiver() {

        System.out.println("\n--- RECEIVER SIDE ---");

        StringBuilder result = new StringBuilder();

        for (String s : segments) {

            System.out.println("Segment Received: " + s);
            result.append(s);
        }

        System.out.println("\nReconstructed Message: " + result.toString());
    }

    public static void main(String[] args) {

        int choice;

        System.out.println("=================================");
        System.out.println(" NETWORK PACKET TRANSMISSION TOOL ");
        System.out.println("=================================");

        System.out.print("\nEnter Message: ");
        message = sc.nextLine();

        do {

            System.out.println("\n----------- MENU -----------");
            System.out.println("1 Application Layer");
            System.out.println("2 Transport Layer (Segmentation)");
            System.out.println("3 Network Layer (Packet Creation)");
            System.out.println("4 Data Link Layer (Frame Creation)");
            System.out.println("5 Physical Layer (Binary)");
            System.out.println("6 Simulate Network Transmission");
            System.out.println("7 Receiver Reconstruction");
            System.out.println("8 Exit");

            System.out.print("Enter Choice: ");
            choice = sc.nextInt();

            switch (choice) {

                case 1:
                    applicationLayer();
                    break;

                case 2:
                    transportLayer();
                    break;

                case 3:
                    networkLayer();
                    break;

                case 4:
                    dataLinkLayer();
                    break;

                case 5:
                    physicalLayer();
                    break;

                case 6:
                    transmission();
                    break;

                case 7:
                    receiver();
                    break;

                case 8:
                    System.out.println("Exiting Simulator...");
                    break;

                default:
                    System.out.println("Invalid choice");
            }

        } while (choice != 8);
    }
}
