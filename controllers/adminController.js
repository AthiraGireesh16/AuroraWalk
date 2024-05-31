const userSchema = require('../model/userModels')
const Order = require('../model/orderModel')
const paginationHelper=require('../helpers/paginationHelper')
const { contains } = require('jquery')

module.exports = {

    usersList : async(req,res)=>{
        try {
            const { search, sortData, sortOrder } = req.query;
        
            let page = Number(req.query.page);
            if (isNaN(page) || page < 1) {
                page = 1;
            }
        
            const condition = { isAdmin: 0 };
        
            const sort = {};
            if (sortData) {
                if (sortOrder === "Ascending") {
                    sort[sortData] = 1;
                } else {
                    sort[sortData] = -1;
                }
            }
        
            if (search) {
                condition.$or = [
                    { firstName: { $regex: search, $options: "i" } },
                    { lastName: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } },
                    { mobile: { $regex: search, $options: "i" } },
                ];
            }
        
            const userCount = await userSchema.countDocuments(condition);
            const userList = await userSchema.find(condition)
                .sort(sort)
                .skip((page - 1) * paginationHelper.USERS_PER_PAGE)
                .limit(paginationHelper.USERS_PER_PAGE);
        
            res.render('admin/userList', {
                userList: userList,
                admin: req.session.admin,
                currentPage: page,
                hasNextPage: page * paginationHelper.USERS_PER_PAGE < userCount,
                hasPrevPage: page > 1,
                nextPage: page + 1,
                prevPage: page - 1,
                lastPage: Math.ceil(userCount / paginationHelper.USERS_PER_PAGE),
                search: search,
                sortData: sortData,
                sortOrder: sortOrder
            })    

        }catch(error){
            console.log(error);
        }
    },

    blockUser: async (req, res) => {
        try {
            const userId = req.params.id;

    
            let userData = await userSchema.findById(userId);
            
    
            
            userData.isBlocked = true;//usere block cheyyunnu
            await userData.save(); // Save the updated user data
    
            
            userData = await userSchema.findById(userId);
    
            // If the user being blocked is currently logged in, delete their session
            if (req.session.user && req.session.user.toString() === userId) {
                req.session.destroy(err => {
                    if (err) {
                        console.log("Error destroying session:", err);
                    }
                    console.log("Session destroyed");
                    
                    res.redirect('/login'); //session destroy chythitt login redirect
                });
            } else {
                res.redirect('/admin/userList'); //userblock chythitt userlistilot redirect cheyyum
            }
        } catch (error) {
            console.log(error);
            res.redirect('/admin/userList'); 
        }
    },
    
    
    

    
    
    
    


    unblockUser : async(req,res) =>{
        try{
            const userId = req.params.id;
            const userData = await userSchema.findById(userId);
            await userData.updateOne({ $set: { isBlocked: false } });
            res.redirect('/admin/userList');
        }catch(error){
            console.log(error);
        }
    },










    getChartData: async (req, res) => {
        try {
            // Monthly sales data aggregation
            const monthlySalesData = await Order.aggregate([
                {
                    $group: {
                        _id: { month: { $month: "$date" }, year: { $year: "$date" } },
                        totalAmount: { $sum: "$totalPrice" },
                    },
                },
                { $sort: { "_id.year": 1, "_id.month": 1 } },
            ]);

            // Calculate start and end date for the current month
            const startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
            const endDate = new Date();

            // Daily sales data aggregation for the current month
            const dailySalesData = await Order.aggregate([
                {
                    $match: {
                        date: {
                            $gte: startDate,
                            $lte: endDate
                        }
                    }
                },
                {
                    $group: {
                        _id: { day: { $dayOfMonth: "$date" }, month: { $month: "$date" }, year: { $year: "$date" } },
                        totalAmount: { $sum: "$totalPrice" },
                    },
                },
                { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
            ]);

            res.json({
                monthlySalesData,
                dailySalesData
            });
        } catch (error) {
            console.error('Error fetching chart data:', error);
            res.status(500).send('Server Error');
        }
    },
    }