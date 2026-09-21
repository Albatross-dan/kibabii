export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          username: string | null
          avatar_url: string | null
          phone: string | null
          role: 'buyer' | 'seller' | 'both' | 'admin'
          student_id: string | null
          department: string | null
          bio: string | null
          rating: number
          total_reviews: number
          seller_rating?: number
          seller_rating_count?: number
          is_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          username?: string | null
          avatar_url?: string | null
          phone?: string | null
          role?: 'buyer' | 'seller' | 'both' | 'admin'
          student_id?: string | null
          department?: string | null
          bio?: string | null
          rating?: number
          total_reviews?: number
          seller_rating?: number
          seller_rating_count?: number
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          username?: string | null
          avatar_url?: string | null
          phone?: string | null
          role?: 'buyer' | 'seller' | 'both' | 'admin'
          student_id?: string | null
          department?: string | null
          bio?: string | null
          rating?: number
          total_reviews?: number
          seller_rating?: number
          seller_rating_count?: number
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          icon: string | null
          parent_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          icon?: string | null
          parent_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          icon?: string | null
          parent_id?: string | null
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          seller_id: string
          category_id: string | null
          subcategory_id: string | null
          condition_id: string | null
          brand_id: string | null
          campus_id: string | null
          store_id: string | null
          title: string
          description: string | null
          price: number
          original_price: number | null
          quantity: number
          is_negotiable: boolean
          location: string | null
          status: string
          currency: string
          slug: string | null
          views?: number
          is_featured?: boolean
          verification_status?: 'pending' | 'approved' | 'rejected' | string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Insert: {
          id?: string
          seller_id: string
          category_id?: string | null
          subcategory_id?: string | null
          condition_id?: string | null
          brand_id?: string | null
          campus_id?: string | null
          store_id?: string | null
          title: string
          description?: string | null
          price: number
          original_price?: number | null
          quantity?: number
          is_negotiable?: boolean
          location?: string | null
          status?: string
          currency?: string
          slug?: string | null
          views?: number
          is_featured?: boolean
          verification_status?: 'pending' | 'approved' | 'rejected' | string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          seller_id?: string
          category_id?: string | null
          subcategory_id?: string | null
          condition_id?: string | null
          brand_id?: string | null
          campus_id?: string | null
          store_id?: string | null
          title?: string
          description?: string | null
          price?: number
          original_price?: number | null
          quantity?: number
          is_negotiable?: boolean
          location?: string | null
          status?: string
          currency?: string
          slug?: string | null
          views?: number
          is_featured?: boolean
          verification_status?: 'pending' | 'approved' | 'rejected' | string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      product_images: {
        Row: {
          id: string
          product_id: string
          image_url: string
          display_order: number
          is_primary: boolean
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          image_url: string
          display_order?: number
          is_primary?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          image_url?: string
          display_order?: number
          is_primary?: boolean
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          buyer_id: string
          seller_id: string
          status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
          total_amount: number
          payment_method: string
          payment_status: 'unpaid' | 'paid' | 'refunded'
          mpesa_transaction_id: string | null
          delivery_address: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          buyer_id: string
          seller_id: string
          status?: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
          total_amount: number
          payment_method?: string
          payment_status?: 'unpaid' | 'paid' | 'refunded'
          mpesa_transaction_id?: string | null
          delivery_address?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          buyer_id?: string
          seller_id?: string
          status?: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
          total_amount?: number
          payment_method?: string
          payment_status?: 'unpaid' | 'paid' | 'refunded'
          mpesa_transaction_id?: string | null
          delivery_address?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
          subtotal: number
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity?: number
          unit_price: number
          subtotal: number
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
          subtotal?: number
        }
      }
      cart_items: {
        Row: {
          id: string
          user_id: string
          product_id: string
          quantity: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          quantity?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          quantity?: number
          created_at?: string
        }
      }
      wishlist: {
        Row: {
          id: string
          user_id: string
          product_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          created_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          reviewer_id: string
          target_type: 'product' | 'service' | 'accommodation' | 'store'
          target_id: string
          seller_id?: string | null
          product_id?: string | null
          order_id: string | null
          rating: number
          comment: string | null
          seller_reply: string | null
          images: string[] | null
          is_verified_purchase: boolean
          helpful_count: number
          status?: string
          created_at: string
          updated_at?: string
        }
        Insert: {
          id?: string
          reviewer_id: string
          target_type: 'product' | 'service' | 'accommodation' | 'store'
          target_id: string
          seller_id?: string | null
          product_id?: string | null
          order_id?: string | null
          rating: number
          comment?: string | null
          seller_reply?: string | null
          images?: string[] | null
          is_verified_purchase?: boolean
          helpful_count?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reviewer_id?: string
          target_type?: 'product' | 'service' | 'accommodation' | 'store'
          target_id?: string
          seller_id?: string | null
          product_id?: string | null
          order_id?: string | null
          rating?: number
          comment?: string | null
          seller_reply?: string | null
          images?: string[] | null
          is_verified_purchase?: boolean
          helpful_count?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string | null
          is_read: boolean
          link: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message?: string | null
          is_read?: boolean
          link?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string | null
          is_read?: boolean
          link?: string | null
          created_at?: string
        }
      }
      flash_deals: {
        Row: {
          id: string
          product_id: string
          discount_percent: number
          starts_at: string
          ends_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          product_id: string
          discount_percent: number
          starts_at: string
          ends_at: string
          is_active?: boolean
        }
        Update: {
          id?: string
          product_id?: string
          discount_percent?: number
          starts_at?: string
          ends_at?: string
          is_active?: boolean
        }
      }
      conversations: {
        Row: {
          id: string
          context_type: 'general' | 'product' | 'service' | 'accommodation' | 'store'
          context_id: string | null
          last_message_at: string | null
          is_archived: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          context_type: 'general' | 'product' | 'service' | 'accommodation' | 'store'
          context_id?: string | null
          last_message_at?: string | null
          is_archived?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          context_type?: 'general' | 'product' | 'service' | 'accommodation' | 'store'
          context_id?: string | null
          last_message_at?: string | null
          is_archived?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      conversation_participants: {
        Row: {
          id: string
          conversation_id: string
          user_id: string
          unread_count: number
          last_read_at: string
          is_muted: boolean
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          user_id: string
          unread_count?: number
          last_read_at?: string
          is_muted?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          user_id?: string
          unread_count?: number
          last_read_at?: string
          is_muted?: boolean
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          body: string
          message_type: 'text' | 'image' | 'offer' | 'system'
          is_deleted: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          body: string
          message_type?: 'text' | 'image' | 'offer' | 'system'
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          body?: string
          message_type?: 'text' | 'image' | 'offer' | 'system'
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      message_attachments: {
        Row: {
          id: string
          message_id: string
          file_url: string
          file_type: string
          file_size_bytes: number | null
          created_at: string
        }
        Insert: {
          id?: string
          message_id: string
          file_url: string
          file_type: string
          file_size_bytes?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          file_url?: string
          file_type?: string
          file_size_bytes?: number | null
          created_at?: string
        }
      }
    }
    Views: {
      public_profiles: {
        Row: {
          id: string
          full_name: string | null
          username: string | null
          avatar_url: string | null
          role: 'buyer' | 'seller' | 'both' | 'admin' | string
          bio: string | null
          rating: number
          total_reviews: number
          is_verified: boolean
          created_at: string
        }
      }
      seller_profiles: {
        Row: {
          id: string
          full_name: string | null
          username: string | null
          avatar_url: string | null
          store_name?: string | null
          store_description?: string | null
          rating: number
          total_reviews: number
          is_verified: boolean
          created_at: string
        }
      }
    }
    Functions: {
      start_conversation: {
        Args: {
          _context_type: 'general' | 'product' | 'service' | 'accommodation' | 'store'
          _context_id: string | null
          _other_user_id: string
        }
        Returns: string
      }
    }
  }
}
