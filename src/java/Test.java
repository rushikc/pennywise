import java.lang.Math;


public class Test {
    public static int pivotIndex(int[] nums) {
        
        int leftSum = 0;
        int rightSum =0;

        int leftIndex = 0;
        int rightIndex = nums.length -1;

        int lval1 = nums[leftIndex]; 
        int rval1 = nums[rightIndex];

        int totalSum = Arrays.stream(nums).sum();
        
        if(totalSum-nums[0] == 0){
            return 0;
        }


        if(totalSum-nums[rightIndex] == 0){
            return rightIndex;
        }


        if(lval1 < rval1){
            leftSum += lval1;
            leftIndex++;
        }
        else if(rval1 < lval1) {
            rightSum += rval1;
            rightIndex--;
        }else{
            leftSum += lval1;
            leftIndex++;
            rightSum += rval1;
            rightIndex--;
        }
        

        System.out.println("\n\n\n-->left sum " + leftSum);
        System.out.println("right sum " + rightSum);
        System.out.println("left index " + leftIndex);
        System.out.println("right index " + rightIndex + "\n\n\n");
        while(true){

            int lval = nums[leftIndex]; 
            int rval = nums[rightIndex];

            int lSum = Math.abs(lval + leftSum);
            int rSum = Math.abs(rval + rightSum);

            if(lSum < rSum){
                leftSum += lval;
                leftIndex++;
            }
            else if(rSum < lSum){
                rightSum += rval;
                rightIndex--;
            }
            
            System.out.println("left lSum " + lSum);
            System.out.println("right rSum " + rSum);
            System.out.println("left sum " + leftSum);
            System.out.println("right sum " + rightSum);
            System.out.println("left index " + leftIndex);
            System.out.println("right index " + rightIndex + "\n\n\n");
            

            // return 0;

            

            if(lSum == rSum){
                System.out.println("lSum == rSum is true");


                if(rightIndex-leftIndex <= 2){

                    if(lval == 0 && rval == 0 && leftSum == rightSum){
                        return leftIndex;
                    }

                    System.out.println("first if " +((leftIndex+rightIndex) % 2));

                    if(((leftIndex+rightIndex) % 2 )!= 1){
                        System.out.println("result " + (leftIndex+rightIndex)/2);
                        return ((leftIndex+rightIndex)/2);
                    }else{
                        System.out.println("result " + -1);
                        return (-1);
                    }
                }else{

                    System.out.println("first else");

                    leftSum += lval;
                    leftIndex++;
                    rightSum += rval;
                    rightIndex--;
                }
            }
            
            if(leftIndex < 0 || rightIndex < 0){
                System.out.println("leftIndex  rightIndex negative");
                return -1;
            }
            
            
        }
    }
    
    public static void main(String[] args){
        // int nums[] = {1,7,3,6,5,6};
        // int nums[] = {-1,-1,-1,-1,-1,-1};
        // int nums[] = {-1,-1,-1,-1,-1,0};
        int nums[] = {-1,-1,-1,-1,1,1};
        pivotIndex(nums);
    }
}
