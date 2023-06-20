import { useEffect, useState } from "react"
// Function that gets random avatar based on wallet address
import { getAvatarUrl } from "../functions/getAvatarUrl"
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import BigNumber from 'bignumber.js';


export const useCashApp = () => {
        const [avatar, setAvatar] = useState("")
        const [userAddress, setUserAddress] = useState("11111111111111111111111111111111")
        const [amount, setAmount] = useState(0)        
        const [receiver, setReceiver] = useState('')
        const [transactionPurpose, setTransactionPurpose] = useState('')

        const {connected, publicKey, sendTransaction} = useWallet()
        const {connection} = useConnection()


        const useLocalStorage = (storageKey, fallbackState) => {
            const [value, setValue] = useState(
                JSON.parse(localStorage.getItem(storageKey)) ?? fallbackState
            )
            useEffect(() => {
                localStorage.setItem(storageKey, JSON.stringify(value));
            }, [value, storageKey])
            return [value, setValue]
        }

        const [transactions, setTransactions] = useLocalStorage('transactions', [])
        const [newTransactionModalOpen, setNewTransactionModalOpen] = useState(false)

        useEffect(() => {
            if(connected) {
                setAvatar(getAvatarUrl(publicKey.toString()))
                setUserAddress(publicKey.toString())
            }
            
        }, [connected])

        const makeTransaction = async (fromWallet, toWallet, amount, reference) => {
            const network = WalletAdapterNetwork.Devnet
            const endpoint = clusterApiUrl(network)
            const connection = new Connection(endpoint)

            const {blockhash} = await connection.getLatestBlockhash('finalized')

            const transaction = new Transaction({
                recentBlockhash: blockhash,
                // Buyer pays transactino fee
                feePayer: fromWallet,
            })
            // INstruction to send sol from owner to reciept
            const transferInstruction = SystemProgram.transfer({
                fromPubkey: fromWallet.publicKey,
                lamports: amount.multiply(LAMPORTS_PER_SOL).toNumber(),
                toPubkey: toWallet,
            })

            transferInstruction.keys.push({
                pubkey: reference,
                isSigner: false,
                isWritable: true,
            })

            return transaction
        }
        
        // Function to run transaction
        const doTransaction = async ({amount, receiver, transactionPurpose}) => {
            const fromWallet = publicKey
            const toWallet = new PublicKey(receiver)
            const bnAmount = new BigNumber(amount)
            const reference = Keypair.generate().publicKey
            const transaction = await makeTransaction(fromWallet, toWallet, bnAmount, reference)

            const txnHash = await sendTransaction(transaction, connection)

            //Create a new transaction object   
            const newID = (transactions.length + 1).toString()
            const newTransaction = {
                id: newID, 
                from: {
                    name: publicKey,
                    handle: publicKey,
                    avatar: getAvatarUrl(publicKey.toString()),
                    verified: true,
                },
                to: {
                    name: receiver,
                    handle: '-',
                    avatar: getAvatarUrl(receiver.toString()),
                    verified: false,
                },
                description: transactionPurpose,
                transactionDate: new Date(),
                status: 'Completed',
                amount: amount,
                source: '-',
                identifier:  '-',
            }
            setNewTransactionModalOpen(false)
            setTransactions([newTransaction, ...transactions])
        }

        return {
            connected, 
            publicKey, 
            avatar, 
            userAddress, 
            doTransaction, 
            amount, 
            setAmount, 
            receiver,
            setReceiver, 
            transactionPurpose, 
            setTransactionPurpose,
            transactions,
            setTransactions,
            setNewTransactionModalOpen,
            newTransactionModalOpen,
        }
}