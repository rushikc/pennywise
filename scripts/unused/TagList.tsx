import { FC, ReactElement, useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { Expense } from "../../src/Types";
import { selectExpense, setTagExpense } from "../../src/store/expenseActions";
import { getDateMonth } from "../../src/utility/utility";
import "./TagList.scss";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/Check";
import { Card, CardContent, Typography, Box, IconButton, CircularProgress } from "@mui/material";
import { useSwipeable } from "react-swipeable";
import TagExpenses from "../../src/pages/home/home-views/TagExpenses";

// Define filter options
type FilterOption = 'all' | 'untagged';



const TagList: FC<any> = (): ReactElement => {
  const { expenseList, isAppLoading } = useSelector(selectExpense);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [noMoreCards, setNoMoreCards] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);
  const [isSwiping, setIsSwiping] = useState<"left" | "right" | null>(null);
  const [cardKey, setCardKey] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState<FilterOption>('untagged');

  // Filter expenses based on selected filter option
  useEffect(() => {
    if (expenseList.length > 0) {
      let filtered;
      if (selectedFilter === 'untagged') {
        filtered = expenseList.filter(expense => !expense.tag);
      } else {
        filtered = [...expenseList];
      }
      setFilteredExpenses(filtered);
      setNoMoreCards(filtered.length === 0);
    }
  }, [expenseList, selectedFilter]);

  const handleTagExpense = (expense: Expense) => {
    setTagExpense(expense);
  };

  const handleSwipe = (direction: "left" | "right") => {
    if (isAnimating || noMoreCards) return;

    setIsAnimating(true);
    setSwipeDirection(direction);

    // If swiping right, open the tag dialog
    if (direction === "right" && currentIndex < filteredExpenses.length) {
      handleTagExpense(filteredExpenses[currentIndex]);
    }

    // Move to the next card after animation
    setTimeout(() => {
      setCurrentIndex(prevIndex => {
        const nextIndex = prevIndex + 1;
        if (nextIndex >= filteredExpenses.length) {
          setNoMoreCards(true);
        }
        return nextIndex;
      });
      setSwipeDirection(null);
      setIsAnimating(false);
      setCardKey(prev => prev + 1);
    }, 300);
  };

  // Configure swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => handleSwipe("left"),
    onSwipedRight: () => handleSwipe("right"),
    onSwiping: (event) => {
      if (isAnimating) return;

      if (event.deltaX < 0) {
        setIsSwiping("left");
      } else if (event.deltaX > 0) {
        setIsSwiping("right");
      }
    },
    onSwipeStart: () => {
      if (!isAnimating) {
        setIsSwiping(null);
      }
    },
    onSwiped: () => {
      setIsSwiping(null);
    },
    preventScrollOnSwipe: true,
    trackMouse: true,
    delta: 10,
    swipeDuration: 500
  });

  // Reset the index when we get new filtered expenses
  useEffect(() => {
    if (filteredExpenses.length > 0) {
      setCurrentIndex(0);
      setNoMoreCards(false);
      setCardKey(0);
    }
  }, [filteredExpenses]);

  // Handle filter selection
  const handleFilterChange = (filter: FilterOption) => {
    setSelectedFilter(filter);
  };

  // Render current expense card
  const renderExpenseCard = useCallback(() => {
    if (noMoreCards || currentIndex >= filteredExpenses.length) {
      return (
        <Card className="expense-card empty-card">
          <CardContent>
            <Typography variant="h6" align="center">
              No more expenses to {selectedFilter === 'untagged' ? 'tag' : 'view'}
            </Typography>
            <Typography variant="body2" color="textSecondary" align="center">
              {selectedFilter === 'untagged'
                ? "You've gone through all untagged expenses!"
                : "You've gone through all expenses!"}
            </Typography>
          </CardContent>
        </Card>
      );
    }

    const expense = filteredExpenses[currentIndex];

    return (
      <div
        key={`expense-card-${cardKey}`}
        className={`card-container ${swipeDirection ? `swipe-${swipeDirection}-active` : ''} ${isSwiping ? `swiping-${isSwiping}` : ''}`}
        {...swipeHandlers}
      >
        <Card className="expense-card">
          <CardContent>
            <Box className="expense-card-header">
              <CurrencyRupeeIcon className="expense-currency-icon" />
              <Typography className="expense-amount" variant="h4">
                ₹{expense.cost}
              </Typography>
            </Box>

            <Typography className="expense-vendor" variant="h5">
              {
                expense.vendor.replace(/_/g, ' ')
                  .replace(/\b\w/g, c => c.toLowerCase())
                    .substring(0,25).toLowerCase()
              }
            </Typography>

            <Typography className="expense-date" variant="body1" color="textSecondary">
              {getDateMonth(expense.date)}
            </Typography>

            <span className={`expense-tag-indicator ${expense.tag ? 'tagged' : 'untagged'}`}>
              {expense.tag ? expense.tag : 'untagged'}
            </span>

            <Box className="expense-card-actions">
              <IconButton
                className="swipe-button reject"
                onClick={() => handleSwipe("left")}
                aria-label="Skip"
              >
                <CloseIcon />
              </IconButton>

              <IconButton
                className="swipe-button accept"
                onClick={() => handleSwipe("right")}
                aria-label="Tag"
              >
                <CheckIcon />
              </IconButton>
            </Box>
          </CardContent>
        </Card>
      </div>
    );
  }, [currentIndex, noMoreCards, filteredExpenses, swipeDirection, isSwiping, swipeHandlers, cardKey, selectedFilter]);

  if (isAppLoading) {
    return (
      <div className="taglist-loading">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="taglist-container">
      <div className="swipeable-container">
        {renderExpenseCard()}
      </div>

      <div className="filter-toggle-group">
        <button
          type="button"
          className={`filter-toggle-btn left${selectedFilter === 'untagged' ? ' active' : ''}`}
          onClick={() => handleFilterChange('untagged')}
        >
          Untagged Only
        </button>
        <div className="filter-divider" />
        <button
          type="button"
          className={`filter-toggle-btn right${selectedFilter === 'all' ? ' active' : ''}`}
          onClick={() => handleFilterChange('all')}
        >
          All Expenses
        </button>
      </div>

      <Typography variant="body2" className="swipe-instructions">
        Swipe right to tag an expense, or left to skip
      </Typography>

      <TagExpenses />
    </div>
  );
};

export default TagList;

