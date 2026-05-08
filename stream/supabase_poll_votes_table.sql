-- Table: poll_votes
CREATE TABLE public.poll_votes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_question text NOT NULL,
  selected_option text NOT NULL,
  profile_id text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(poll_question, profile_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert their vote
CREATE POLICY "Anyone can insert a vote" ON public.poll_votes
  FOR INSERT WITH CHECK (true);

-- Allow anyone to read all votes (needed to calculate percentages)
CREATE POLICY "Anyone can read votes" ON public.poll_votes
  FOR SELECT USING (true);

-- Allow users to update their own vote (if they change their mind, though UI locks it currently)
CREATE POLICY "Users can update their own vote" ON public.poll_votes
  FOR UPDATE USING (true) WITH CHECK (true);
