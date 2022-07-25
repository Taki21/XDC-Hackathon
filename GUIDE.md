# XDC Flashloan Contract Guide

This guide will show you the basics of setting up a flashloan smart contract for your own personal use.

WXDCVault Address: `0xAf5Ecd6461fe07082adFa432bD1b9e704866689A`

## FlashBorrowerExample.sol

These are all the interfaces that you will need:

```
// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

interface IERC20 {
    function totalSupply() external view returns (uint);
    function balanceOf(address account) external view returns (uint);
    function transfer(address recipient, uint amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint);
    function approve(address spender, uint amount) external returns (bool);
    function transferFrom(
        address sender,
        address recipient,
        uint amount
    ) external returns (bool);
    event Transfer(address indexed from, address indexed to, uint value);
    event Approval(address indexed owner, address indexed spender, uint value);
}

interface IUniswapV2Router {
  function getAmountsOut(uint256 amountIn, address[] memory path)
    external
    view
    returns (uint256[] memory amounts);
  
  function swapExactTokensForTokens(
  
    //amount of tokens we are sending in
    uint256 amountIn,
    //the minimum amount of tokens we want out of the trade
    uint256 amountOutMin,
    //list of token addresses we are going to trade in.  this is necessary to calculate amounts
    address[] calldata path,
    //this is the address we are going to send the output tokens to
    address to,
    //the last time that the trade is valid for
    uint256 deadline
  ) external returns (uint256[] memory amounts);
}

interface IUniswapV2Pair {
  function token0() external view returns (address);
  function token1() external view returns (address);
  function swap(
    uint256 amount0Out,
    uint256 amount1Out,
    address to,
    bytes calldata data
  ) external;
}

interface IUniswapV2Factory {
  function getPair(address token0, address token1) external returns (address);
}

interface IERC3156FlashBorrower {
    /**
     * @dev Receive a flash loan.
     * @param initiator The initiator of the loan.
     * @param token The loan currency.
     * @param amount The amount of tokens lent.
     * @param fee The additional amount of tokens to repay.
     * @param data Arbitrary data structure, intended to contain user-defined parameters.
     * @return The keccak256 hash of "ERC3156FlashBorrower.onFlashLoan"
     */
    function onFlashLoan(
        address initiator,
        address token,
        uint256 amount,
        uint256 fee,
        address router1,
        address router2,
        address swapToken,
        uint256 swapIn,
        bytes calldata data
    ) external returns (bytes32);
}
```

The following are addresses to the Routers of XDCSwaps and XSwap:

`address private constant XDC_SWAPS_ROUTER = 0x948fE8BB54383745c87E9607dA245D91207E3bF0;`

`address private constant X_SWAP_ROUTER = 0xf9c5E4f6E627201aB2d6FB6391239738Cf4bDcf9;`

This is where the arbitrage logic will be executed:

```
contract FlashBorrower is IERC3156FlashBorrower {
    uint256 MAX_INT = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;

    address private constant WXDC = 0x951857744785E80e2De051c32EE7b25f9c458C42;

    // This function does the actual swap on the router provided
    function swap(address _router, address _tokenIn, address _tokenOut, uint256 _amountIn, uint256 _amountOutMin, address _to) internal {
        IERC20(_tokenIn).approve(_router, _amountIn);

        address[] memory path;
        if (_tokenIn == WXDC || _tokenOut == WXDC) {
            path = new address[](2);
            path[0] = _tokenIn;
            path[1] = _tokenOut;
        } else {
            path = new address[](3);
            path[0] = _tokenIn;
            path[1] = WXDC;
            path[2] = _tokenOut;
        }

        IUniswapV2Router(_router).swapExactTokensForTokens(_amountIn, _amountOutMin, path, _to, block.timestamp);
    }
    
    // This function will help you find the minimum output from amount in specified
    function getAmountOutMin(address _router, address _tokenIn, address _tokenOut, uint256 _amountIn) public view returns (uint256) {

        address[] memory path;
        if (_tokenIn == WXDC || _tokenOut == WXDC) {
            path = new address[](2);
            path[0] = _tokenIn;
            path[1] = _tokenOut;
        } else {
            path = new address[](3);
            path[0] = _tokenIn;
            path[1] = WXDC;
            path[2] = _tokenOut;
        }
        
        uint256[] memory amountOutMins = IUniswapV2Router(_router).getAmountsOut(_amountIn, path);
        return amountOutMins[path.length -1];  
    }  

    // @dev ERC-3156 Flash loan callback
    function onFlashLoan(
        address initiator,
        address token,
        uint256 amount,
        uint256 fee,
        address router1,
        address router2,
        address swapToken,
        uint256 swapIn,
        bytes calldata data
    ) external override returns (bytes32) {
        
        // Set the allowance to payback the flash loan
        IERC20(token).approve(msg.sender, MAX_INT);
        
        // arbitrage logic
        // In this example, WXDC will be swapped to the desired token in the first DEX and swapped back to WXDC in the other DEX in hopes of profit
        uint256 router1Out = getAmountOutMin(router1, WXDC, swapToken, swapIn);
        uint256 router2Out = getAmountOutMin(router2, swapToken, WXDC, router1Out);

        swap(router1, WXDC, swapToken, swapIn, router1Out, address(this));
        swap(router2, swapToken, WXDC, router1Out, router2Out, address(this));

        // Return success to the lender, he will transfer get the funds back if allowance is set accordingly
        return keccak256('ERC3156FlashBorrower.onFlashLoan');
    }
}
```
## Calling the Flashloan

Using the deployed contract at the very top of the guide (WXDCVault.sol), you can call the `flashLoan` function found in the code

```
    function flashLoan(
        IERC3156FlashBorrower receiver, // this will be the address of the deployed FlashBorrowerExample.sol contract
        address token, // the token you are borrowing so WXDC contract
        uint256 amount, // amount borrowing
        address router1, // the first DEX router to buy
        address router2, // the second DEX router to sell
        address swapToken, // the token you are swapping to
        uint256 swapIn, // same value as amount borrowing
        bytes calldata data // For this paramater, simply input '0x'
    ) external override returns(bool) {
        require(
            supportedTokens[token],
            "FlashLender: Unsupported currency"
        );
        fee = _flashFee(token, amount);
        require(
            IERC20(token).transfer(address(receiver), amount),
            "FlashLender: Transfer failed"
        );
        require(
            receiver.onFlashLoan(msg.sender, token, amount, fee, router1, router2, swapToken, swapIn, data) == CALLBACK_SUCCESS,
            "FlashLender: Callback failed"
        );
        require(
            IERC20(token).transferFrom(address(receiver), address(this), amount + fee),
            "FlashLender: Repay failed"
        );
        return true;
    }
`
