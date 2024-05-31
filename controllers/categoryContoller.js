
const paginationHelper=require('../helpers/paginationHelper')

const categorySchema = require('../model/categoryModel')
const offerSchema = require('../model/offerModel')


const flash = require('express-flash')


module.exports ={
    getCategory : async(req,res)=>{
        try{
            const {search , sortData , sortOrder} = req.query
            let page = Number(req.query.page)
            if(isNaN(page) || page < 1){
                pagee = 1;
            }

            const condition = {}
            if(search){
                condition.$or = [{
                    category : {$regex : search , $options :'i' }
                }]
            }

            let sort = {}; // Initialize an empty object for sorting

            if (sortData) {
                if (sortOrder === 'Ascending') {
                     sort[sortData] = 1; 
                } else {
                    sort[sortData] = -1; 
            }
}

            const availableOffers = await offerSchema.find({ status : true, expiryDate : { $gte : new Date() }})
            const categoryCount = await categorySchema.find( condition ).count()
            const category = await categorySchema.find( condition ).populate('offer')
            .sort( sort ).skip(( page - 1 ) * paginationHelper.CATEGORY_PER_PAGE ).limit( paginationHelper.CATEGORY_PER_PAGE )

            res.render( 'admin/category', {
                admin : req.session.admin,
                category : category,
                currentPage : page,
                hasNextPage : page * paginationHelper.CATEGORY_PER_PAGE < categoryCount,
                hasPrevPage : page > 1,
                nextPage : page + 1,
                prevPage : page -1,
                lastPage : Math.ceil( categoryCount / paginationHelper.CATEGORY_PER_PAGE ),
                search : search,
                sortData : sortData,
                sortOrder : sortOrder,
                availableOffers : availableOffers

            } )
        
        }catch(error){
            console.log(error);
        }
    },
    addCategory :async(req,res)=>{
        try {
            const cat = req.body.category.toUpperCase();
            const category = await categorySchema.findOne({ category: cat });
            if (category) {
                req.flash('categoryExist', 'Category already exists');
            } else {
                const categoryName = new categorySchema({ category: cat });
                await categoryName.save();
                
                res.redirect('/admin/category');
            }
        } catch (error) {
            res.redirect(error);
        }
        
    },
    
    
    geteditCategory: async (req, res) => {
        try {
            const category = await categorySchema.findOne({ _id: req.params.id });
         
            req.session.admin = true; // Session assignment, replace with your actual session logic
            res.render('admin/edit-category', { category: category, admin: req.session.admin }); // Pass category data to the view
        } catch (error) {
            console.log(error);
        }
    },
    

    editCategory: async (req, res) => {
        try {
            const updatedCategory = req.body.category.toUpperCase();
            const categoryId = req.body.categoryId;
            const same = await categorySchema.findOne({ category: updatedCategory, _id: { $ne: categoryId } });
    
            if (same) {
                req.flash('categoryExist', 'Category already exists');
                return res.redirect('/admin/category'); 
            } else {
                await categorySchema.updateOne({ _id: categoryId }, { $set: { category: updatedCategory } });
                return res.redirect('/admin/category'); 
            }
        }   catch (error) {
            console.log(error);
            return res.redirect('/500'); 
        }
    },
    
    
    
    listCategory: async (req, res) => {
        try {
            await categorySchema.updateOne({ _id: req.params.id }, { $set: { status: true } });
            res.redirect('/admin/category');
        } catch (error) {
            console.log(error);
        }
    },
    

    //soft delete
    unlistCategory:async(req,res)=>{
        try{
            await categorySchema.updateOne({_id:req.params.id},{$set:{status:false}})
            res.redirect('/admin/category')
        }catch(error){
            res.redirect('/500')
        }
    },
    deleteCategory :async(req,res)=>{
        try{
            await categorySchema.deleteOne({_id:req.params.id})
            res.redirect('/admin/category')
        }catch(error){
            console.log(error);
        }
    },
    //applying category offer
    applyCategoryOffer:async(req,res)=>{
        try{
            const {offerId,categoryId}=req.body
            console.log(offerId);
            await categorySchema.updateOne({_id:categoryId},{
                $set:{
                    offer:offerId
                }
            })
            res.json({success:true})
        }catch(error){
            res.redirect('/500')
        }
    },
    //cancel the categry offer
    removeCategoryOffer:async(req,res)=>{
        try{
            const {categoryId}=req.body
            await categorySchema.updateOne({_id:categoryId},{
                $unset:{
                    offer:""
                }
            })
            res.json({success:true})
        }catch(error){
            res.redirect('/500')
        }
    },
}